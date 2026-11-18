import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';

export const tratarErro: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) { next(error); return; }
  if (error instanceof AppError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      res.status(409).json({ message: 'Registro já cadastrado' });
      return;
    }
    if (error.code === 'P2003') {
      res.status(409).json({ message: 'Relacionamento inválido ou registro vinculado a outros dados' });
      return;
    }
    if (error.code === 'P2025') {
      res.status(404).json({ message: 'Registro não encontrado' });
      return;
    }
  }
  if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
    res.status(400).json({ message: 'JSON inválido' });
    return;
  }
  if (typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.too.large') {
    res.status(400).json({ message: 'Corpo da requisição acima do limite permitido' });
    return;
  }
  console.error('Erro interno na API.');
  res.status(500).json({ message: 'Erro interno do servidor' });
};
