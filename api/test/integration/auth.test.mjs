import assert from 'node:assert/strict';
import { once } from 'node:events';
import test, { before, after } from 'node:test';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import express from 'express';
import { startApi } from '../helpers/api-server.mjs';
import { prisma } from '../../dist/lib/prisma.js';
import { autenticar } from '../../dist/middlewares/autenticar.js';
import { tratarErro } from '../../dist/middlewares/tratarErro.js';

assert.equal(new URL(process.env.DATABASE_URL).pathname, `/${process.env.PETSHOP_TEST_DATABASE}`);
assert.match(process.env.PETSHOP_TEST_DATABASE, /^petshop_test_[a-f0-9]{32}$/);
let server;
let base;
let loginToken;
const input = { nome: 'Teste Auth', email: 'auth@example.com', senha: 'Senha@123' };
const request = async (path, body) => {
  const response = await fetch(base + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const text = await response.text();
  assert.equal(text.includes('senhaHash'), false);
  assert.equal(text.includes(input.senha), false);
  assert.equal(text.includes('stack'), false);
  return { status: response.status, body: JSON.parse(text) };
};
before(async () => {
  server = await startApi();
  base = server.base;
});
after(async () => {
  if (server) {
    await server.stop();
    if (loginToken) server.assertLogsDoNotContain(loginToken, 'JWT de acesso');
  }
  await prisma.$disconnect();
});

test('cadastro 201 retorna só id/nome/email e persiste bcrypt', async () => {
  const result = await request('/auth/cadastro', input);
  assert.equal(result.status, 201);
  assert.deepEqual(Object.keys(result.body).sort(), ['email', 'id', 'nome']);
  const stored = await prisma.usuario.findUniqueOrThrow({ where: { email: input.email } });
  assert.notEqual(stored.senhaHash, input.senha);
  assert.equal(await bcrypt.compare(input.senha, stored.senhaHash), true);
});
test('login 200 retorna contrato e JWT HS256 com validade de uma hora', async () => {
  const result = await request('/auth/login', { ...input, email: 'AUTH@example.com' });
  assert.equal(result.status, 200);
  loginToken = result.body.token;
  assert.deepEqual(Object.keys(result.body).sort(), ['token', 'usuario']);
  assert.deepEqual(Object.keys(result.body.usuario).sort(), ['email', 'id', 'nome']);
  const decoded = jwt.verify(result.body.token, process.env.JWT_SECRET, { algorithms: ['HS256'], issuer: 'petshop-api' });
  assert.equal(decoded.sub, String(result.body.usuario.id));
  assert.equal(decoded.exp - decoded.iat, 3600);
});
test('duplicidade de e-mail normalizado retorna 409 do Prisma real', async () => {
  assert.equal((await request('/auth/cadastro', { ...input, email: ' AUTH@example.com ' })).status, 409);
});
test('credenciais incorretas ou usuário ausente retornam 401 uniforme', async () => {
  for (const data of [{ ...input, senha: 'Incorreta123' }, { ...input, email: 'ausente@example.com' }]) {
    assert.deepEqual(await request('/auth/login', data), { status: 401, body: { message: 'E-mail ou senha inválidos' } });
  }
});
test('Zod retorna 400 com errors por campo e não cria usuário inválido', async () => {
  const result = await request('/auth/cadastro', { nome: ' ', email: 'invalido', senha: 'curta' });
  assert.equal(result.status, 400);
  assert.equal(result.body.message, 'Dados inválidos');
  assert.deepEqual(result.body.errors.map(error => error.field).sort(), ['email', 'nome', 'senha']);
  assert.equal(await prisma.usuario.count(), 1);
});
test('JSON malformado e rota desconhecida têm respostas controladas', async () => {
  const invalid = await fetch(base + '/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
  });
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { message: 'JSON inválido' });
  const missing = await fetch(base + '/nao-existe');
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { message: 'Rota não encontrada' });
});
test('middleware Bearer rejeita token ausente, inválido, expirado e algoritmo indevido', async () => {
  const harness = express();
  harness.get('/', autenticar, (req, res) => res.json(req.auth));
  harness.get('/falha', () => { throw new Error('Detalhe privado'); });
  harness.use(tratarErro);
  const local = harness.listen(0, '127.0.0.1');
  await once(local, 'listening');
  const url = `http://127.0.0.1:${local.address().port}`;
  const expired = jwt.sign({}, process.env.JWT_SECRET, { subject: '1', issuer: 'petshop-api', expiresIn: -1 });
  const badAlgorithm = jwt.sign({}, process.env.JWT_SECRET, { subject: '1', issuer: 'petshop-api', algorithm: 'HS384' });
  try {
    for (const authorization of ['', 'Basic abc', 'Bearer invalido', `Bearer ${expired}`, `Bearer ${badAlgorithm}`]) {
      assert.equal((await fetch(url, { headers: { authorization } })).status, 401);
    }
    const login = await request('/auth/login', input);
    const good = await fetch(url, { headers: { authorization: `Bearer ${login.body.token}` } });
    assert.equal(good.status, 200);
    assert.equal((await good.json()).usuarioId, login.body.usuario.id);
    const failure = await fetch(url + '/falha');
    assert.equal(failure.status, 500);
    assert.deepEqual(await failure.json(), { message: 'Erro interno do servidor' });
  } finally {
    await new Promise(resolve => local.close(resolve));
  }
});
