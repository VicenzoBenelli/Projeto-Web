import type { Request, Response } from 'express';
import type { TutorInput } from '../contracts';
import { tutorService } from '../services/tutorService';
import { obterId } from './obterId';

type TutorRequest = Request<{ id: string }, unknown, TutorInput>;
export const tutorController = {
  async listar(_req: Request, res: Response): Promise<void> {
    res.status(200).json(await tutorService.listar());
  },
  async buscar(req: TutorRequest, res: Response): Promise<void> {
    res.status(200).json(await tutorService.buscar(obterId(req.params.id)));
  },
  async criar(req: TutorRequest, res: Response): Promise<void> {
    res.status(201).json(await tutorService.criar(req.body));
  },
  async editar(req: TutorRequest, res: Response): Promise<void> {
    res.status(200).json(await tutorService.editar(obterId(req.params.id), req.body));
  },
  async excluir(req: TutorRequest, res: Response): Promise<void> {
    await tutorService.excluir(obterId(req.params.id));
    res.status(204).end();
  },
};
