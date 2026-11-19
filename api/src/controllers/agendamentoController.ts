import type { Request, Response } from 'express';
import type { AgendamentoInput } from '../contracts';
import { agendamentoService } from '../services/agendamentoService';
import { obterId } from './obterId';

type AgendamentoRequest = Request<{ id: string }, unknown, AgendamentoInput>;

export const agendamentoController = {
  async listar(_req: Request, res: Response): Promise<void> {
    res.status(200).json(await agendamentoService.listar());
  },
  async buscar(req: AgendamentoRequest, res: Response): Promise<void> {
    res.status(200).json(await agendamentoService.buscar(obterId(req.params.id)));
  },
  async criar(req: AgendamentoRequest, res: Response): Promise<void> {
    res.status(201).json(await agendamentoService.criar(req.body));
  },
  async editar(req: AgendamentoRequest, res: Response): Promise<void> {
    res.status(200).json(await agendamentoService.editar(obterId(req.params.id), req.body));
  },
  async excluir(req: AgendamentoRequest, res: Response): Promise<void> {
    await agendamentoService.excluir(obterId(req.params.id));
    res.status(204).end();
  },
};
