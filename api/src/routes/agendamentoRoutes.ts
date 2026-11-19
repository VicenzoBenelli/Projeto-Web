import { Router } from 'express';
import { agendamentoSchema } from '../contracts';
import { agendamentoController } from '../controllers/agendamentoController';
import { autenticar } from '../middlewares/autenticar';
import { validarBody } from '../middlewares/validarSchema';

export const agendamentoRoutes = Router();
agendamentoRoutes.use(autenticar);
agendamentoRoutes.get('/', agendamentoController.listar);
agendamentoRoutes.get('/:id', agendamentoController.buscar);
agendamentoRoutes.post('/', validarBody(agendamentoSchema), agendamentoController.criar);
agendamentoRoutes.put('/:id', validarBody(agendamentoSchema), agendamentoController.editar);
agendamentoRoutes.delete('/:id', agendamentoController.excluir);
