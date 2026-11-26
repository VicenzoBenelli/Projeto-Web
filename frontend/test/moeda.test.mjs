import test from 'node:test';
import assert from 'node:assert/strict';
import { formatarBRL, paraCentavos, formatarEntradaMoeda } from '../src/utils/moeda.ts';

test('R$ 50,00 trafega como 5000 centavos', () => {
  assert.equal(paraCentavos('50,00'), 5000);
  assert.equal(paraCentavos('50'), 5000);
  assert.equal(paraCentavos('1.234,56'), 123456);
  assert.equal(paraCentavos('0,5'), 50);
});

test('entradas inválidas de preço viram null em vez de número errado', () => {
  assert.equal(paraCentavos(''), null);
  assert.equal(paraCentavos('abc'), null);
  assert.equal(paraCentavos('0,00'), null);
  assert.equal(paraCentavos('-5'), null);
  assert.equal(paraCentavos('50,000'), null);
});

test('formata centavos inteiros para edição em reais', () => {
  assert.equal(formatarEntradaMoeda('5000'), '50,00');
  assert.equal(formatarEntradaMoeda('505'), '5,05');
  assert.equal(formatarEntradaMoeda('abc'), '');
});

test('formatarBRL exibe centavos em reais', () => {
  const normalizar = texto => texto.replace(/\u00A0/g, ' ');
  assert.equal(normalizar(formatarBRL(5000)), 'R$ 50,00');
  assert.equal(normalizar(formatarBRL(123456)), 'R$ 1.234,56');
});
