import test from 'node:test';
import assert from 'node:assert/strict';
import { paraIsoDataHora, paraValorDataHora, formatarDataHora } from '../src/utils/data.ts';

test('datetime-local do fuso local converte para ISO 8601 com timezone e volta', () => {
  const iso = paraIsoDataHora('2026-11-24T14:30');
  const data = new Date(iso);

  assert.equal(data.getFullYear(), 2026);
  assert.equal(data.getMonth(), 10);
  assert.equal(data.getDate(), 24);
  assert.equal(data.getHours(), 14);
  assert.equal(data.getMinutes(), 30);
  // ISO com fuso (Z ou offset) exigido pelo agendamentoSchema
  assert.match(iso, /(Z|[+-]\d{2}:\d{2})$/);

  // ida e volta mantém o horário local exibido
  assert.equal(paraValorDataHora(iso), '2026-11-24T14:30');
});

test('datas inválidas são rejeitadas sem lançar', () => {
  assert.equal(paraIsoDataHora(''), null);
  assert.equal(paraIsoDataHora('não é data'), null);
  assert.equal(paraValorDataHora('não é data'), '');
  assert.equal(formatarDataHora('não é data'), '—');
});
