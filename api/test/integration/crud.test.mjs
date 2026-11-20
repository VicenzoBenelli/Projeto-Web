import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import { startApi } from '../helpers/api-server.mjs';
import { prisma } from '../../dist/lib/prisma.js';

assert.equal(new URL(process.env.DATABASE_URL).pathname, `/${process.env.PETSHOP_TEST_DATABASE}`);
assert.match(process.env.PETSHOP_TEST_DATABASE, /^petshop_test_[a-f0-9]{32}$/);
let server;
let base;
let token;
let tutor;
let secondTutor;
let animal;
let secondAnimal;
let servico;
let secondServico;
let agendamento;
let secondAgendamento;
const tutorInput = { nome: 'Tutor HTTP', cpf: '33333333333', telefone: '11999999999' };
const servicoInput = { nome: 'Tosa HTTP', descricao: 'Tosa completa', precoCentavos: 7500, duracaoMinutos: 45 };
const agendamentoInput = overrides => ({
  animalId: animal.id,
  servicoId: servico.id,
  dataHora: '2026-12-03T12:00:00-03:00',
  ...overrides,
});
const call = async (method, path, body, authenticated = true) => {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(authenticated ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  assert.equal(text.includes('senhaHash'), false);
  assert.equal(text.includes('stack'), false);
  return { status: response.status, body: text ? JSON.parse(text) : null, text };
};
before(async () => {
  server = await startApi();
  base = server.base;
  const usuario = { nome: 'CRUD', email: 'crud@example.com', senha: 'Senha@123' };
  assert.equal((await call('POST', '/auth/cadastro', usuario, false)).status, 201);
  const login = await call('POST', '/auth/login', usuario, false);
  assert.equal(login.status, 200);
  token = login.body.token;
});
after(async () => {
  if (server) await server.stop();
  await prisma.$disconnect();
});

test('as 20 rotas CRUD exigem JWT, inclusive POST/PUT inválidos', async () => {
  for (const entity of ['tutores', 'animais', 'servicos', 'agendamentos']) {
    for (const [method, suffix] of [['GET', ''], ['GET', '/1'], ['POST', ''], ['PUT', '/1'], ['DELETE', '/1']]) {
      const body = ['POST', 'PUT'].includes(method) ? {} : undefined;
      assert.equal((await call(method, `/${entity}${suffix}`, body, false)).status, 401);
    }
  }
});
test('POST /servicos 201 e GET de lista e id retornam contrato completo', async () => {
  const created = await call('POST', '/servicos', servicoInput);
  assert.equal(created.status, 201);
  servico = created.body;
  assert.deepEqual(servico, { id: servico.id, ...servicoInput });

  const list = await call('GET', '/servicos');
  assert.equal(list.status, 200);
  assert.ok(list.body.some(item => item.id === servico.id));
  const item = await call('GET', `/servicos/${servico.id}`);
  assert.equal(item.status, 200);
  assert.deepEqual(item.body, servico);
});
test('PUT /servicos/:id 200 substitui o corpo completo e aceita descrição ausente', async () => {
  assert.equal((await call('PUT', `/servicos/${servico.id}`, { nome: 'Parcial' })).status, 400);
  const edited = await call('PUT', `/servicos/${servico.id}`, {
    nome: 'Tosa HTTP Atualizada', precoCentavos: 8200, duracaoMinutos: 50,
  });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.nome, 'Tosa HTTP Atualizada');
  assert.equal(edited.body.precoCentavos, 8200);
  assert.equal(edited.body.duracaoMinutos, 50);
  assert.equal(edited.body.descricao, null);
  servico = edited.body;
});
test('nome de serviço duplicado em POST e PUT retorna 409 sem alterar dados', async () => {
  assert.equal((await call('POST', '/servicos', { ...servicoInput, nome: servico.nome })).status, 409);
  const created = await call('POST', '/servicos', { ...servicoInput, nome: 'Hidratação HTTP' });
  assert.equal(created.status, 201);
  secondServico = created.body;
  assert.equal((await call('PUT', `/servicos/${secondServico.id}`, { ...servicoInput, nome: servico.nome })).status, 409);
  assert.equal((await call('GET', `/servicos/${secondServico.id}`)).body.nome, 'Hidratação HTTP');
});
test('POST e PUT /servicos rejeitam nome vazio e valores não positivos ou não inteiros', async () => {
  for (const [field, value] of [['nome', ' '], ['precoCentavos', 0], ['precoCentavos', 1.5], ['duracaoMinutos', -1]]) {
    const invalid = { ...servicoInput, [field]: value };
    for (const method of ['POST', 'PUT']) {
      const result = await call(method, method === 'POST' ? '/servicos' : `/servicos/${servico.id}`, invalid);
      assert.equal(result.status, 400);
      assert.equal(result.body.message, 'Dados inválidos');
      assert.ok(result.body.errors.some(error => error.field === field));
    }
  }
});
test('POST /tutores 201 e criadoEm UTC', async () => {
  const result = await call('POST', '/tutores', tutorInput);
  assert.equal(result.status, 201);
  tutor = result.body;
  assert.equal(tutor.nome, tutorInput.nome);
  assert.equal(new Date(tutor.criadoEm).toISOString(), tutor.criadoEm);
});
test('GET /tutores e GET /tutores/:id 200', async () => {
  const list = await call('GET', '/tutores');
  assert.equal(list.status, 200);
  assert.ok(list.body.some(item => item.id === tutor.id));
  const item = await call('GET', `/tutores/${tutor.id}`);
  assert.equal(item.status, 200);
  assert.deepEqual(item.body, tutor);
});
test('PUT /tutores/:id 200 exige corpo inteiro', async () => {
  assert.equal((await call('PUT', `/tutores/${tutor.id}`, { nome: 'Parcial' })).status, 400);
  const edited = await call('PUT', `/tutores/${tutor.id}`, { ...tutorInput, nome: 'Tutor Editado' });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.nome, 'Tutor Editado');
  tutor = edited.body;
});
test('CPF duplicado em POST e PUT retorna 409 e preserva dados', async () => {
  assert.equal((await call('POST', '/tutores', tutorInput)).status, 409);
  const created = await call('POST', '/tutores', { ...tutorInput, cpf: '44444444444' });
  assert.equal(created.status, 201);
  secondTutor = created.body;
  assert.equal((await call('PUT', `/tutores/${secondTutor.id}`, tutorInput)).status, 409);
  assert.equal((await call('GET', `/tutores/${secondTutor.id}`)).body.cpf, '44444444444');
});
test('POST /animais 201 com tutor público', async () => {
  const result = await call('POST', '/animais', { nome: 'Rex HTTP', especie: 'CACHORRO', raca: 'SRD', tutorId: tutor.id });
  assert.equal(result.status, 201);
  animal = result.body;
  assert.deepEqual(animal.tutor, { id: tutor.id, nome: tutor.nome });
});
test('GET /animais e GET /animais/:id 200 incluem só tutor id/nome', async () => {
  const list = await call('GET', '/animais');
  assert.equal(list.status, 200);
  assert.deepEqual(list.body.find(item => item.id === animal.id).tutor, { id: tutor.id, nome: tutor.nome });
  const item = await call('GET', `/animais/${animal.id}`);
  assert.equal(item.status, 200);
  assert.deepEqual(item.body.tutor, { id: tutor.id, nome: tutor.nome });
});
test('PUT /animais/:id 200 substitui corpo e limpa raca omitida/null', async () => {
  assert.equal((await call('PUT', `/animais/${animal.id}`, { nome: 'Parcial' })).status, 400);
  for (const raca of [undefined, 'Persa', null]) {
    const result = await call('PUT', `/animais/${animal.id}`, { nome: 'Mia', especie: 'GATO', tutorId: tutor.id, raca });
    assert.equal(result.status, 200);
    assert.equal(result.body.raca, raca ?? null);
    animal = result.body;
  }
});
test('animal com tutor inexistente retorna 409 em POST e PUT', async () => {
  for (const [method, path] of [['POST', '/animais'], ['PUT', `/animais/${animal.id}`]]) {
    assert.equal((await call(method, path, { nome: 'Sem tutor', especie: 'GATO', tutorId: 2147483647 })).status, 409);
  }
  assert.equal((await call('GET', `/animais/${animal.id}`)).body.tutorId, tutor.id);
});
test('POST /agendamentos 201 usa status padrão e devolve relações aninhadas', async () => {
  const created = await call('POST', '/agendamentos', agendamentoInput());
  assert.equal(created.status, 201);
  agendamento = created.body;
  assert.equal(agendamento.status, 'AGENDADO');
  assert.equal(agendamento.dataHora, '2026-12-03T15:00:00.000Z');
  assert.deepEqual(agendamento.animal, { nome: animal.nome, tutor: { nome: tutor.nome } });
  assert.deepEqual(agendamento.servico, { nome: servico.nome });
});
test('agendamentos aceitam outros tutor/animal/serviço e status enum', async () => {
  const createdAnimal = await call('POST', '/animais', {
    nome: 'Bela HTTP', especie: 'GATO', tutorId: secondTutor.id,
  });
  assert.equal(createdAnimal.status, 201);
  secondAnimal = createdAnimal.body;

  const created = await call('POST', '/agendamentos', agendamentoInput({
    animalId: secondAnimal.id,
    servicoId: secondServico.id,
    dataHora: '2026-12-04T10:30:00Z',
    status: 'CONCLUIDO',
    observacoes: 'Atendimento concluído',
  }));
  assert.equal(created.status, 201);
  secondAgendamento = created.body;
  assert.equal(secondAgendamento.status, 'CONCLUIDO');
  assert.deepEqual(secondAgendamento.animal, { nome: secondAnimal.nome, tutor: { nome: secondTutor.nome } });
  assert.deepEqual(secondAgendamento.servico, { nome: secondServico.nome });
});
test('GET /agendamentos e GET /agendamentos/:id repetem as relações aninhadas', async () => {
  const list = await call('GET', '/agendamentos');
  assert.equal(list.status, 200);
  assert.deepEqual(list.body.find(item => item.id === agendamento.id), agendamento);
  assert.deepEqual(list.body.find(item => item.id === secondAgendamento.id), secondAgendamento);

  const item = await call('GET', `/agendamentos/${agendamento.id}`);
  assert.equal(item.status, 200);
  assert.deepEqual(item.body, agendamento);
});
test('PUT /agendamentos/:id 200 atualiza data/status e preserva o formato aninhado', async () => {
  const updated = await call('PUT', `/agendamentos/${agendamento.id}`, agendamentoInput({
    dataHora: '2026-12-05T11:00:00Z',
    status: 'CANCELADO',
    observacoes: null,
  }));
  assert.equal(updated.status, 200);
  agendamento = updated.body;
  assert.equal(agendamento.status, 'CANCELADO');
  assert.equal(agendamento.dataHora, '2026-12-05T11:00:00.000Z');
  assert.equal(agendamento.observacoes, null);
  assert.deepEqual(agendamento.animal, { nome: animal.nome, tutor: { nome: tutor.nome } });
  assert.deepEqual(agendamento.servico, { nome: servico.nome });
});
test('POST e PUT /agendamentos rejeitam data/hora e status inválidos com 400', async () => {
  for (const [field, value] of [
    ['dataHora', '2026-12-03T12:00:00'],
    ['dataHora', '2026-02-30T12:00:00Z'],
    ['dataHora', 'amanhã'],
    ['status', 'INVALIDO'],
  ]) {
    for (const method of ['POST', 'PUT']) {
      const result = await call(method,
        method === 'POST' ? '/agendamentos' : `/agendamentos/${agendamento.id}`,
        agendamentoInput({ [field]: value }));
      assert.equal(result.status, 400);
      assert.equal(result.body.message, 'Dados inválidos');
      assert.ok(result.body.errors.some(error => error.field === field));
    }
  }
});
test('POST e PUT /agendamentos rejeitam animalId e servicoId inexistentes com 409 útil', async () => {
  for (const [field, value, message] of [
    ['animalId', 2147483647, 'Animal informado não encontrado'],
    ['servicoId', 2147483647, 'Serviço informado não encontrado'],
  ]) {
    for (const method of ['POST', 'PUT']) {
      const result = await call(method,
        method === 'POST' ? '/agendamentos' : `/agendamentos/${agendamento.id}`,
        agendamentoInput({ [field]: value }));
      assert.equal(result.status, 409);
      assert.deepEqual(result.body, { message });
    }
  }
  assert.equal((await call('GET', `/agendamentos/${agendamento.id}`)).body.status, 'CANCELADO');
});

test('fusos inválidos retornam 400 por campo em POST/PUT e preservam o agendamento', async () => {
  for (const offset of ['+24:00', '+99:99', '+03:99', '-24:00', '-03:60']) {
    for (const method of ['POST', 'PUT']) {
      const result = await call(method,
        method === 'POST' ? '/agendamentos' : `/agendamentos/${agendamento.id}`,
        agendamentoInput({ dataHora: `2026-12-01T10:00:00${offset}` }));
      assert.equal(result.status, 400);
      assert.equal(result.body.message, 'Dados inválidos');
      assert.ok(result.body.errors.some(error => error.field === 'dataHora'));
    }
  }
  assert.deepEqual((await call('GET', `/agendamentos/${agendamento.id}`)).body, agendamento);
});
test('POST e PUT usam schemas compartilhados e retornam errors por campo', async () => {
  for (const [path, id, body, field] of [
    ['/tutores', tutor.id, { ...tutorInput, cpf: '123' }, 'cpf'],
    ['/animais', animal.id, { nome: ' ', especie: 'GATO', tutorId: tutor.id }, 'nome'],
  ]) {
    for (const method of ['POST', 'PUT']) {
      const result = await call(method, path + (method === 'PUT' ? `/${id}` : ''), body);
      assert.equal(result.status, 400);
      assert.equal(result.body.message, 'Dados inválidos');
      assert.ok(result.body.errors.some(error => error.field === field));
    }
  }
});
test('ids malformados retornam 400; ids ausentes retornam 404 nas duas entidades', async () => {
  for (const [path, body] of [
    ['/tutores', tutorInput], ['/animais', { nome: 'Mia', especie: 'GATO', tutorId: tutor.id }],
    ['/servicos', servicoInput],
    ['/agendamentos', agendamentoInput()],
  ]) {
    for (const method of ['GET', 'PUT', 'DELETE']) {
      for (const id of ['0', '-1', 'abc', '1.5', '1e1', '2147483648']) {
        assert.equal((await call(method, `${path}/${id}`, method === 'PUT' ? body : undefined)).status, 400);
      }
      assert.equal((await call(method, `${path}/2147483647`, method === 'PUT' ? body : undefined)).status, 404);
    }
  }
});
test('DELETE /agendamentos/:id 204 sem corpo; depois retorna 404', async () => {
  for (const item of [agendamento, secondAgendamento]) {
    const deleted = await call('DELETE', `/agendamentos/${item.id}`);
    assert.equal(deleted.status, 204);
    assert.equal(deleted.text, '');
    assert.equal((await call('GET', `/agendamentos/${item.id}`)).status, 404);
    assert.equal((await call('DELETE', `/agendamentos/${item.id}`)).status, 404);
  }
});
test('DELETE tutor com filhos retorna 409 por FK RESTRICT real', async () => {
  assert.equal((await call('DELETE', `/tutores/${tutor.id}`)).status, 409);
  assert.equal((await call('GET', `/tutores/${tutor.id}`)).status, 200);
});
test('DELETE animal com agendamento retorna 409 e protege serviço por FK', async () => {
  const servico = await prisma.servico.create({ data: { nome: 'Fixture FK', precoCentavos: 1000, duracaoMinutos: 30 } });
  const agenda = await prisma.agendamento.create({
    data: { animalId: animal.id, servicoId: servico.id, dataHora: new Date('2026-12-01T13:00:00Z') },
  });
  assert.equal((await call('DELETE', `/animais/${animal.id}`)).status, 409);
  await assert.rejects(prisma.servico.delete({ where: { id: servico.id } }), error => error.code === 'P2003');
  await prisma.agendamento.delete({ where: { id: agenda.id } });
  await prisma.servico.delete({ where: { id: servico.id } });
});
test('DELETE serviço vinculado retorna 409 explicativo; sem vínculo retorna 204', async () => {
  const agenda = await prisma.agendamento.create({
    data: { animalId: animal.id, servicoId: servico.id, dataHora: new Date('2026-12-02T13:00:00Z') },
  });
  const blocked = await call('DELETE', `/servicos/${servico.id}`);
  assert.equal(blocked.status, 409);
  assert.match(blocked.body.message, /agendamentos vinculados/);
  assert.equal((await call('GET', `/servicos/${servico.id}`)).status, 200);

  await prisma.agendamento.delete({ where: { id: agenda.id } });
  const deleted = await call('DELETE', `/servicos/${servico.id}`);
  assert.equal(deleted.status, 204);
  assert.equal(deleted.text, '');
  assert.equal((await call('GET', `/servicos/${servico.id}`)).status, 404);
  assert.equal((await call('DELETE', `/servicos/${servico.id}`)).status, 404);

  assert.equal((await call('DELETE', `/servicos/${secondServico.id}`)).status, 204);
});
test('DELETE /animais/:id e /tutores/:id 204 sem corpo; depois 404', async () => {
  for (const path of [
    `/animais/${animal.id}`, `/animais/${secondAnimal.id}`, `/tutores/${tutor.id}`, `/tutores/${secondTutor.id}`,
  ]) {
    const deleted = await call('DELETE', path);
    assert.equal(deleted.status, 204);
    assert.equal(deleted.text, '');
    assert.equal((await call('GET', path)).status, 404);
    assert.equal((await call('DELETE', path)).status, 404);
  }
});
