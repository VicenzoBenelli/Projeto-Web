import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout } from 'node:timers/promises';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const apiDir = resolve(root, 'api');
const requireApi = createRequire(resolve(apiDir, 'package.json'));
const { PrismaClient } = requireApi('@prisma/client');
requireApi('dotenv').config({ path: resolve(apiDir, '.env') });
const source = new URL(process.env.DATABASE_URL);
assert.equal(source.hostname, '127.0.0.1', 'E2E exige PostgreSQL local explícito');
const database = `petshop_e2e_${randomUUID().replaceAll('-', '')}`;
assert.match(database, /^petshop_e2e_[a-f0-9]{32}$/);
const adminUrl = new URL(source); adminUrl.pathname = '/postgres';
const testUrl = new URL(source); testUrl.pathname = `/${database}`;
const admin = new PrismaClient({ datasourceUrl: adminUrl.href });
const output = mkdtempSync(resolve(tmpdir(), 'petshop-ui-'));
const secret = randomBytes(48).toString('hex');
const env = { ...process.env, DATABASE_URL: testUrl.href, PETSHOP_E2E_DATABASE: database,
  JWT_SECRET: secret, E2E_OUTPUT_DIR: output, NODE_ENV: 'test' };
const logs = [];
const children = [];
async function run(args, cwd) {
  const child = spawn(process.execPath, args, { cwd, env, stdio: 'inherit', windowsHide: true });
  const [code] = await once(child, 'exit');
  assert.equal(code, 0, `E2E: comando falhou (${args[0]})`);
}
async function freePort() {
  const socket = createServer().listen(0, '127.0.0.1'); await once(socket, 'listening');
  const port = socket.address().port; await new Promise(r => socket.close(r)); return port;
}
function start(args, cwd) {
  const child = spawn(process.execPath, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  const exited = once(child, 'exit'); children.push({ child, exited });
  child.stdout.on('data', b => logs.push(b.toString())); child.stderr.on('data', b => logs.push(b.toString()));
  return child;
}
async function ready(url, child) {
  for (let i = 0; i < 150; i++) {
    assert.equal(child.exitCode, null, 'Servidor encerrou durante inicialização');
    try { if ((await fetch(url)).ok) return; } catch { /* aguarda socket próprio */ }
    await setTimeout(100);
  }
  throw new Error('Servidor E2E não iniciou');
}
let created = false;
try {
  assert.equal((await admin.$queryRaw`SELECT datname FROM pg_database WHERE datname=${database}`).length, 0);
  await admin.$executeRawUnsafe(`CREATE DATABASE "${database}"`); created = true;
  console.info(`E2E banco criado: ${database}; artefatos: ${output}`);
  const prisma = resolve(root, 'node_modules/prisma/build/index.js');
  await run([prisma, 'validate'], apiDir);
  await run([prisma, 'migrate', 'deploy'], apiDir);
  await run([prisma, 'migrate', 'diff', '--from-schema-datasource', 'prisma/schema.prisma',
    '--to-schema-datamodel', 'prisma/schema.prisma', '--exit-code'], apiDir);
  await run(['prisma/verify-seed.mjs'], apiDir);
  const apiPort = await freePort(); const uiPort = await freePort();
  Object.assign(env, { PORT: String(apiPort), CORS_ORIGIN: `http://127.0.0.1:${uiPort}`,
    VITE_API_URL: `http://127.0.0.1:${apiPort}`, E2E_API_URL: `http://127.0.0.1:${apiPort}`, E2E_BASE_URL: `http://127.0.0.1:${uiPort}` });
  const api = start(['dist/server.js'], apiDir); await ready(`${env.E2E_API_URL}/health`, api);
  const vite = start([resolve(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', String(uiPort), '--strictPort'], resolve(root, 'frontend'));
  await ready(env.E2E_BASE_URL, vite);
  await run([resolve(root, 'node_modules/@playwright/test/cli.js'), 'test'], resolve(root, 'frontend'));
} finally {
  for (const { child, exited } of children.reverse()) {
    if (child.exitCode === null) child.kill('SIGTERM');
    await exited;
  }
  try {
    if (created) {
      assert.equal((await admin.$queryRaw`SELECT pid FROM pg_stat_activity WHERE datname=${database}`).length, 0);
      await admin.$executeRawUnsafe(`DROP DATABASE "${database}"`);
      assert.equal((await admin.$queryRaw`SELECT datname FROM pg_database WHERE datname=${database}`).length, 0);
      console.info(`E2E cleanup confirmado: ${database} ausente.`);
    }
    assert.ok(!logs.join('').includes(secret), 'JWT_SECRET apareceu nos logs');
    assert.ok(!logs.join('').includes('PetShop@2026!'), 'Senha apareceu nos logs');
    assert.ok(!/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(logs.join('')), 'JWT apareceu nos logs');
  } finally { await admin.$disconnect(); }
}
