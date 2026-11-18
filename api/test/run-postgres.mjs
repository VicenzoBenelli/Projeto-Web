import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

// Nunca executa a suíte no banco configurado: cria banco descartável novo.
const source = new URL(process.env.DATABASE_URL);
assert.equal(source.hostname, '127.0.0.1', 'O teste exige PostgreSQL local explícito');
const database = `petshop_test_${randomUUID().replaceAll('-', '')}`;
assert.match(database, /^petshop_test_[a-f0-9]{32}$/);
const adminUrl = new URL(source);
adminUrl.pathname = '/postgres';
const testUrl = new URL(source);
testUrl.pathname = `/${database}`;
const admin = new PrismaClient({ datasourceUrl: adminUrl.href });
const env = {
  ...process.env, DATABASE_URL: testUrl.href, NODE_ENV: 'test',
  JWT_SECRET: randomBytes(48).toString('hex'), PETSHOP_TEST_DATABASE: database,
};
const run = args => {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', env });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, 'Comando do gate PostgreSQL falhou');
};
let created = false;
try {
  const existing = await admin.$queryRaw`SELECT datname FROM pg_database WHERE datname = ${database}`;
  assert.equal(existing.length, 0);
  await admin.$executeRawUnsafe(`CREATE DATABASE "${database}"`);
  created = true;
  console.info(`Banco descartável criado: ${database}`);
  run([resolve('../node_modules/prisma/build/index.js'), 'migrate', 'deploy']);
  const files = readdirSync('test/integration').filter(file => file.endsWith('.test.mjs'));
  assert.ok(files.length > 0);
  run(['--test', '--test-concurrency=1', ...files.map(file => `test/integration/${file}`)]);
} finally {
  if (created) {
    const active = await admin.$queryRaw`
      SELECT pid FROM pg_stat_activity WHERE datname = ${database}
    `;
    assert.equal(active.length, 0, 'Conexões pendentes impedem cleanup seguro');
    await admin.$executeRawUnsafe(`DROP DATABASE "${database}"`);
    const remaining = await admin.$queryRaw`SELECT datname FROM pg_database WHERE datname = ${database}`;
    assert.equal(remaining.length, 0);
    console.info(`Cleanup confirmado: ${database} ausente.`);
  }
  await admin.$disconnect();
}
