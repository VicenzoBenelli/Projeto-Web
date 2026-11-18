import assert from 'node:assert/strict';
import test from 'node:test';
import * as contracts from '../dist/contracts.js';

test('API resolve os seis schemas compilados do workspace shared', () => {
  for (const name of ['tutorSchema', 'animalSchema', 'servicoSchema', 'agendamentoSchema', 'cadastroSchema', 'loginSchema']) {
    assert.equal(typeof contracts[name].safeParse, 'function');
  }
});
