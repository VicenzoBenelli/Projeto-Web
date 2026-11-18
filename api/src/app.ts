import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/authRoutes';
import { tutorRoutes } from './routes/tutorRoutes';
import { animalRoutes } from './routes/animalRoutes';
import { tratarErro } from './middlewares/tratarErro';

export const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.use('/auth', authRoutes);
app.use('/tutores', tutorRoutes);
app.use('/animais', animalRoutes);
app.use((_req, res) => { res.status(404).json({ message: 'Rota não encontrada' }); });
app.use(tratarErro);
