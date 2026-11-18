import assert from 'node:assert/strict';
import test from 'node:test';
import { getJwtSecret } from '../dist/config.js';

test('JWT_SECRET ausente, curto ou exemplo é rejeitado sem revelar valor', () => {
  const original = process.env.JWT_SECRET;
  try {
    for (const value of [undefined, 'curto', 'substitua-por-segredo-longo-aleatorio-no-ambiente-local']) {
      if (value === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = value;
      assert.throws(getJwtSecret, /Configure JWT_SECRET/);
    }
    process.env.JWT_SECRET = 's'.repeat(48);
    assert.equal(getJwtSecret().length, 48);
  } finally {
    if (original === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original;
  }
});
