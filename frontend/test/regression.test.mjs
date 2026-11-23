import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesTutor } from '../src/utils/search.ts';
import { restoreSession, tokenExpiresAt } from '../src/auth/session.ts';
const now = 2000000;
const token = (exp) => `header.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.signature`;
const user = JSON.stringify({ id: 1, nome: 'Ana', email: 'ana@example.com', senha: 'não persistir' });

test('pesquisar Ana não inclui Bruno por CPF vazio', () => {
  const records = [{ nome: 'Ana', cpf: '11111111111' }, { nome: 'Bruno', cpf: '22222222222' }];
  assert.deepEqual(records.filter(t => matchesTutor(t, 'Ana')).map(t => t.nome), ['Ana']);
});
test('pesquisa por CPF aceita formatação e partes numéricas', () => {
  assert.equal(matchesTutor({ nome: 'Bruno', cpf: '12345678901' }, '123.456.789-01'), true);
  assert.equal(matchesTutor({ nome: 'Ana', cpf: '11111111111' }, '222'), false);
});
test('pesquisa vazia e nome com espaços mantêm comportamento esperado', () => {
  assert.equal(matchesTutor({ nome: 'Ana', cpf: '11111111111' }, '  '), true);
  assert.equal(matchesTutor({ nome: 'Ana', cpf: '11111111111' }, ' aNA '), true);
});
test('restaura sessão válida e seleciona somente usuário público', () => {
  const value = restoreSession(token(3000), user, now);
  assert.deepEqual(value.usuario, { id: 1, nome: 'Ana', email: 'ana@example.com' });
  assert.equal(tokenExpiresAt(value.token), 3000000);
});
test('sessão expirada é rejeitada inclusive no instante de expiração', () => {
  assert.equal(restoreSession(token(2000), user, now), null);
  assert.equal(restoreSession(token(1999), user, now), null);
});
test('token malformado, exp ausente ou não numérico são rejeitados', () => {
  for (const value of ['invalido', token(undefined), token('3000')]) assert.equal(restoreSession(value, user, now), null);
});
test('pares incompletos e JSON corrompido não reabrem rotas protegidas', () => {
  for (const [jwt, usuario] of [[null, user], [token(3000), null], [token(3000), '{']]) {
    assert.equal(restoreSession(jwt, usuario, now), null);
  }
});
test('usuário com tipo inválido não é recuperado do storage', () => {
  for (const id of ['1', 0, -1]) assert.equal(restoreSession(token(3000), JSON.stringify({ id, nome: 'Ana', email: 'a@b.com' }), now), null);
});
