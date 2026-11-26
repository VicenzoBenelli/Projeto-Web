import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { inteiroPositivo } from '../src/utils/inteiro.ts';
import { formatarEntradaMoeda, paraCentavos } from '../src/utils/moeda.ts';
import { dataHoraParaSalvar, paraIsoDataHora, paraValorDataHora } from '../src/utils/data.ts';

test('duração exige dígitos e inteiro positivo no intervalo PostgreSQL', () => {
  for (const input of ['-30', '1.5', 'abc30', '1e3', '30min', '+30', '0', '', '2147483648']) {
    assert.equal(inteiroPositivo(input), null, input);
  }
  assert.equal(inteiroPositivo('30'), 30);
  assert.equal(inteiroPositivo('2147483647'), 2147483647);
});

test('preço converte edição, digitação em reais e texto monetário colado', () => {
  for (const [text, cents] of [['5', 500], ['50', 5000], ['50,0', 5000], ['50,00', 5000],
    ['R$ 80,50', 8050], ['R$\u00a01.234,56', 123456], ['0,01', 1], ['21.474.836,47', 2147483647]]) {
    assert.equal(paraCentavos(text), cents, text);
    assert.equal(paraCentavos(formatarEntradaMoeda(String(cents))), cents);
  }
});

test('preço não aceita negativos, expoentes, ponto decimal, agrupamento ambíguo ou estouro', () => {
  for (const text of ['-50,00', 'R$ -50,00', 'abc30', '1e3', '50.00', '1.234', '12.34,56',
    '5 000,00', '50,000', '1,,2', '50,', '0,00', '21.474.836,48', '900719925474099100000']) {
    assert.equal(paraCentavos(text), null, text);
  }
});

test('datas inexistentes e horas normalizadas são rejeitadas', () => {
  for (const text of ['2026-02-30T12:00', '2027-02-29T09:30', '2026-04-31T09:30',
    '2026-11-24T24:00', '2026-11-24T12:60', '2026-11-24T12:00Z', '2026-11-24']) {
    assert.equal(paraIsoDataHora(text), null, text);
  }
  assert.ok(paraIsoDataHora('2028-02-29T09:30'));
});

test('edição sem mudança no campo mantém segundos e milissegundos', () => {
  const original = '2026-11-24T14:30:37.125Z';
  assert.equal(dataHoraParaSalvar(paraValorDataHora(original), original), original);
  assert.equal(dataHoraParaSalvar('', original), null);
});

const moduloData = new URL('../src/utils/data.ts', import.meta.url).href;
for (const [fuso, esperado] of [
  ['UTC', '2028-02-29T14:30:37.125Z'],
  ['America/Fortaleza', '2028-02-29T17:30:37.125Z'],
  ['Asia/Kathmandu', '2028-02-29T08:45:37.125Z'],
  ['America/New_York', '2028-02-29T19:30:37.125Z'],
]) {
  test('conversão local e edição em ' + fuso, () => {
    const script = [
      'import assert from "node:assert/strict";',
      'import { paraIsoDataHora, paraValorDataHora, dataHoraParaSalvar } from ' + JSON.stringify(moduloData) + ';',
      'const original = ' + JSON.stringify(esperado) + ';',
      'assert.equal(paraIsoDataHora("2028-02-29T14:30:37.125"), original);',
      'assert.equal(paraValorDataHora(original), "2028-02-29T14:30");',
      'assert.equal(dataHoraParaSalvar("2028-02-29T14:30", original), original);',
      ...(fuso === 'America/New_York' ? [
        'assert.equal(paraIsoDataHora("2026-03-08T02:30"), null);',
        'const segundaOcorrencia = "2026-11-01T06:30:45.125Z";',
        'assert.equal(paraValorDataHora(segundaOcorrencia), "2026-11-01T01:30");',
        'assert.equal(dataHoraParaSalvar("2026-11-01T01:30", segundaOcorrencia), segundaOcorrencia);',
      ] : []),
    ].join('\n');
    const result = spawnSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', script], {
      encoding: 'utf8', env: { ...process.env, TZ: fuso },
    });
    assert.equal(result.status, 0, result.stderr);
  });
}
