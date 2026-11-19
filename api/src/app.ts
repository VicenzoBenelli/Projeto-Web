import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/authRoutes';
import { tutorRoutes } from './routes/tutorRoutes';
import { animalRoutes } from './routes/animalRoutes';
import { servicoRoutes } from './routes/servicoRoutes';
import { agendamentoRoutes } from './routes/agendamentoRoutes';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './docs/openapi';
import { tratarErro } from './middlewares/tratarErro';

export const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.use('/auth', authRoutes);
app.use('/tutores', tutorRoutes);
app.use('/animais', animalRoutes);
app.use('/servicos', servicoRoutes);
app.use('/agendamentos', agendamentoRoutes);
app.get('/docs/openapi.json', (_req, res) => res.status(200).json(openApiDocument));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, {
  customSiteTitle: 'Pet Shop API - OpenAPI',
  swaggerOptions: { displayRequestDuration: true, filter: true },
}));
app.use((_req, res) => { res.status(404).json({ message: 'Rota não encontrada' }); });
app.use(tratarErro);
