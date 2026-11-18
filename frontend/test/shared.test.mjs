import assert from 'node:assert/strict';
import test from 'node:test';
import * as contracts from '@petshop/shared';

test('frontend resolve os seis schemas exportados pelo shared', () => {
  for (const name of ['tutorSchema', 'animalSchema', 'servicoSchema', 'agendamentoSchema', 'cadastroSchema', 'loginSchema']) {
    assert.equal(typeof contracts[name].safeParse, 'function');
  }
});
