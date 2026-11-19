import { Router } from 'express';
import { servicoSchema } from '../contracts';
import { servicoController } from '../controllers/servicoController';
import { autenticar } from '../middlewares/autenticar';
import { validarBody } from '../middlewares/validarSchema';

export const servicoRoutes = Router();
servicoRoutes.use(autenticar);
servicoRoutes.get('/', servicoController.listar);
servicoRoutes.get('/:id', servicoController.buscar);
servicoRoutes.post('/', validarBody(servicoSchema), servicoController.criar);
servicoRoutes.put('/:id', validarBody(servicoSchema), servicoController.editar);
servicoRoutes.delete('/:id', servicoController.excluir);
