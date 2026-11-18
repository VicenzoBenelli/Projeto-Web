import express from 'express';
import cors from 'cors';

export const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
// As rotas de autenticação e dos módulos serão adicionadas nas tarefas V04/V05.
