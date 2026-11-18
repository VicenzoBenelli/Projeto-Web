import { Router } from 'express';
import { animalSchema } from '../contracts';
import { animalController } from '../controllers/animalController';
import { autenticar } from '../middlewares/autenticar';
import { validarBody } from '../middlewares/validarSchema';

export const animalRoutes = Router();
animalRoutes.use(autenticar);
animalRoutes.get('/', animalController.listar);
animalRoutes.get('/:id', animalController.buscar);
animalRoutes.post('/', validarBody(animalSchema), animalController.criar);
animalRoutes.put('/:id', validarBody(animalSchema), animalController.editar);
animalRoutes.delete('/:id', animalController.excluir);
