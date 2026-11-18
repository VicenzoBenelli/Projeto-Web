import type { AnimalInput } from '../contracts';
import { AppError } from '../errors/AppError';
import { animalRepository } from '../repositories/animalRepository';
import { tutorRepository } from '../repositories/tutorRepository';

async function conferirTutor(tutorId: number): Promise<void> {
  if (!(await tutorRepository.buscar(tutorId))) throw new AppError(409, 'Tutor informado não encontrado');
}

export const animalService = {
  listar() { return animalRepository.listar(); },
  async buscar(id: number) {
    const animal = await animalRepository.buscar(id);
    if (!animal) throw new AppError(404, 'Animal não encontrado');
    return animal;
  },
  async criar(data: AnimalInput) {
    await conferirTutor(data.tutorId);
    return animalRepository.criar({ ...data, raca: data.raca ?? null });
  },
  async editar(id: number, data: AnimalInput) {
    if (!(await animalRepository.buscar(id))) throw new AppError(404, 'Animal não encontrado');
    await conferirTutor(data.tutorId);
    return animalRepository.editar(id, { ...data, raca: data.raca ?? null });
  },
  async excluir(id: number) { await animalRepository.excluir(id); },
};
