import { Router } from 'express';
import { tutorSchema } from '../contracts';
import { tutorController } from '../controllers/tutorController';
import { autenticar } from '../middlewares/autenticar';
import { validarBody } from '../middlewares/validarSchema';

export const tutorRoutes = Router();
tutorRoutes.use(autenticar);
tutorRoutes.get('/', tutorController.listar);
tutorRoutes.get('/:id', tutorController.buscar);
tutorRoutes.post('/', validarBody(tutorSchema), tutorController.criar);
tutorRoutes.put('/:id', validarBody(tutorSchema), tutorController.editar);
tutorRoutes.delete('/:id', tutorController.excluir);
