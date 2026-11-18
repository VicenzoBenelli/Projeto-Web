import assert from 'node:assert/strict';
import test from 'node:test';
import {
  tutorSchema, animalSchema, servicoSchema, agendamentoSchema, cadastroSchema, loginSchema, idSchema,
} from '../dist/index.js';

const tutor = { nome: 'Ana', cpf: '00000000000', telefone: '11999999999' };
const animal = { nome: 'Rex', especie: 'CACHORRO', tutorId: 1 };
const servico = { nome: 'Banho', precoCentavos: 5000, duracaoMinutos: 60 };
const agendamento = { animalId: 1, servicoId: 1, dataHora: '2026-12-01T10:00:00-03:00' };
const cadastro = { nome: 'Ana', email: 'ANA@example.com', senha: 'Senha@123' };

for (const [name, schema, valid] of [
  ['tutor', tutorSchema, tutor], ['animal', animalSchema, animal],
  ['serviço', servicoSchema, servico], ['agendamento', agendamentoSchema, agendamento],
  ['cadastro', cadastroSchema, cadastro], ['login', loginSchema, cadastro],
]) {
  test(`${name}: aceita entrada válida e rejeita campos obrigatórios ausentes`, () => {
    assert.equal(schema.safeParse(valid).success, true);
    assert.equal(schema.safeParse({}).success, false);
  });
}

for (const [field, value] of [
  ['nome', '  '], ['nome', null], ['cpf', '123'], ['cpf', '111.111.111-11'],
  ['cpf', '1234567890a'], ['telefone', '119999999'], ['telefone', '119999999999'],
]) {
  test(`tutor: rejeita ${field}=${JSON.stringify(value)}`, () => {
    const result = tutorSchema.safeParse({ ...tutor, [field]: value });
    assert.equal(result.success, false);
    assert.equal(result.error.issues[0].path[0], field);
  });
}

test('CPF confere apenas 11 dígitos; telefone aceita limites 10 e 11', () => {
  for (const telefone of ['1199999999', '11999999999']) {
    assert.equal(tutorSchema.safeParse({ ...tutor, telefone }).success, true);
  }
});

for (const value of [0, -1, 1.5, '1', null, Infinity, 2147483648]) {
  test(`ids e valores monetários rejeitam ${JSON.stringify(value)}`, () => {
    assert.equal(idSchema.safeParse(value).success, false);
    assert.equal(servicoSchema.safeParse({ ...servico, precoCentavos: value }).success, false);
    assert.equal(servicoSchema.safeParse({ ...servico, duracaoMinutos: value }).success, false);
    assert.equal(animalSchema.safeParse({ ...animal, tutorId: value }).success, false);
  });
}

test('campos opcionais aceitam omissão/null/texto e rejeitam texto vazio', () => {
  for (const [schema, valid, field] of [
    [animalSchema, animal, 'raca'], [servicoSchema, servico, 'descricao'],
    [agendamentoSchema, agendamento, 'observacoes'],
  ]) {
    for (const value of [undefined, null, ' exemplo ']) {
      assert.equal(schema.safeParse({ ...valid, [field]: value }).success, true);
    }
    assert.equal(schema.safeParse({ ...valid, [field]: '  ' }).success, false);
  }
});

test('datetime exige fuso, valida a data e normaliza em UTC', () => {
  assert.equal(agendamentoSchema.parse(agendamento).dataHora, '2026-12-01T13:00:00.000Z');
  assert.equal(agendamentoSchema.parse(agendamento).status, 'AGENDADO');
  for (const dataHora of ['2026-12-01T10:00:00', '2026-02-30T13:00:00Z', 'amanhã']) {
    assert.equal(agendamentoSchema.safeParse({ ...agendamento, dataHora }).success, false);
  }
  assert.equal(agendamentoSchema.safeParse({ ...agendamento, status: 'INVALIDO' }).success, false);
  assert.equal(animalSchema.safeParse({ ...animal, especie: 'INVALIDA' }).success, false);
});

test('auth normaliza e-mail, preserva senha e evita truncamento bcrypt', () => {
  assert.equal(cadastroSchema.parse(cadastro).email, 'ana@example.com');
  assert.equal(loginSchema.parse({ ...cadastro, senha: ' Senha@123 ' }).senha, ' Senha@123 ');
  for (const senha of ['1234567', 'x'.repeat(73), 'á'.repeat(37)]) {
    assert.equal(cadastroSchema.safeParse({ ...cadastro, senha }).success, false);
    assert.equal(loginSchema.safeParse({ ...cadastro, senha }).success, false);
  }
  assert.equal(cadastroSchema.safeParse({ ...cadastro, senha: 'x'.repeat(72) }).success, true);
  assert.equal(cadastroSchema.safeParse({ ...cadastro, email: 'invalido' }).success, false);
  assert.equal('senhaHash' in cadastroSchema.parse({ ...cadastro, senhaHash: 'ignorar' }), false);
});
