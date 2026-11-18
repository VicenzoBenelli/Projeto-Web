import { Router } from 'express';
import { cadastroSchema, loginSchema } from '../contracts';
import { cadastrar, login } from '../controllers/authController';
import { validarBody } from '../middlewares/validarSchema';

export const authRoutes = Router();
authRoutes.post('/cadastro', validarBody(cadastroSchema), cadastrar);
authRoutes.post('/login', validarBody(loginSchema), login);
