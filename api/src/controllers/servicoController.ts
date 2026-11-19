import type { Request, Response } from 'express';
import type { ServicoInput } from '../contracts';
import { servicoService } from '../services/servicoService';
import { obterId } from './obterId';

type ServicoRequest = Request<{ id: string }, unknown, ServicoInput>;

export const servicoController = {
  async listar(_req: Request, res: Response): Promise<void> {
    res.status(200).json(await servicoService.listar());
  },
  async buscar(req: ServicoRequest, res: Response): Promise<void> {
    res.status(200).json(await servicoService.buscar(obterId(req.params.id)));
  },
  async criar(req: ServicoRequest, res: Response): Promise<void> {
    res.status(201).json(await servicoService.criar(req.body));
  },
  async editar(req: ServicoRequest, res: Response): Promise<void> {
    res.status(200).json(await servicoService.editar(obterId(req.params.id), req.body));
  },
  async excluir(req: ServicoRequest, res: Response): Promise<void> {
    await servicoService.excluir(obterId(req.params.id));
    res.status(204).end();
  },
};
