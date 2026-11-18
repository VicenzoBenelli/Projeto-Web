import 'dotenv/config';
import { app } from './app';

const port = Number(process.env.PORT ?? 3001);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error('PORT deve ser um número entre 1 e 65535');
}
app.listen(port, () => console.info(`API Pet Shop disponível na porta ${port}`));
