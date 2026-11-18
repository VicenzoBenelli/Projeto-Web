import type { Request, Response } from 'express';
import type { AnimalInput } from '../contracts';
import { animalService } from '../services/animalService';
import { obterId } from './obterId';

type AnimalRequest = Request<{ id: string }, unknown, AnimalInput>;
export const animalController = {
  async listar(_req: Request, res: Response): Promise<void> {
    res.status(200).json(await animalService.listar());
  },
  async buscar(req: AnimalRequest, res: Response): Promise<void> {
    res.status(200).json(await animalService.buscar(obterId(req.params.id)));
  },
  async criar(req: AnimalRequest, res: Response): Promise<void> {
    res.status(201).json(await animalService.criar(req.body));
  },
  async editar(req: AnimalRequest, res: Response): Promise<void> {
    res.status(200).json(await animalService.editar(obterId(req.params.id), req.body));
  },
  async excluir(req: AnimalRequest, res: Response): Promise<void> {
    await animalService.excluir(obterId(req.params.id));
    res.status(204).end();
  },
};
