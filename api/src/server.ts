import 'dotenv/config';
import { app } from './app';
import { getJwtSecret } from './config';
import { prisma } from './lib/prisma';

const port = Number(process.env.PORT ?? 3001);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error('PORT deve ser um número entre 1 e 65535');
}
getJwtSecret();
const server = app.listen(port, () => console.info(`API Pet Shop disponível na porta ${port}`));
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.close(() => { void prisma.$disconnect().finally(() => { process.exit(0); }); });
  });
}
