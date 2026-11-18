import 'dotenv/config';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const counts = async () => Object.fromEntries(await Promise.all(
  ['usuario', 'tutor', 'animal', 'servico', 'agendamento'].map(async name => [name, await prisma[name].count()]),
));
try {
  const results = [];
  for (let run = 1; run <= 2; run++) {
    const seed = spawnSync(process.execPath, ['--import', 'tsx', 'prisma/seed.ts'], { stdio: 'inherit' });
    assert.equal(seed.status, 0, `Seed ${run} falhou`);
    results.push(await counts());
  }
  assert.deepEqual(results[0], results[1]);
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { email: 'professor@petshop.com' } });
  assert.notEqual(usuario.senhaHash, 'PetShop@2026!');
  assert.equal(await bcrypt.compare('PetShop@2026!', usuario.senhaHash), true);
  const agenda = await prisma.agendamento.findFirstOrThrow({
    where: { observacoes: 'Demonstração' }, include: { animal: { include: { tutor: true } }, servico: true },
  });
  assert.equal(agenda.animal.tutor.cpf, '12345678901');
  assert.equal(agenda.servico.nome, 'Banho');
  assert.equal(agenda.dataHora.toISOString(), '2026-12-01T13:00:00.000Z');
  const restrictions = await prisma.$queryRaw`
    SELECT conname, confdeltype::text AS confdeltype FROM pg_constraint
    WHERE contype = 'f' AND connamespace = 'public'::regnamespace
  `;
  assert.equal(restrictions.length, 3);
  assert.equal(restrictions.every(row => row.confdeltype === 'r'), true);
  console.info(`Seed duplo estável: ${JSON.stringify(results[1])}; hash bcrypt, relações e 3 FKs RESTRICT conferidos.`);
} finally {
  await prisma.$disconnect();
}
