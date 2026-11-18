import type { Request, Response } from 'express';
import type { CadastroInput, LoginInput } from '../contracts';
import { authService } from '../services/authService';

export async function cadastrar(req: Request<Record<string, never>, unknown, CadastroInput>, res: Response): Promise<void> {
  res.status(201).json(await authService.cadastrar(req.body));
}

export async function login(req: Request<Record<string, never>, unknown, LoginInput>, res: Response): Promise<void> {
  res.status(200).json(await authService.login(req.body));
}
