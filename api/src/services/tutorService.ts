import type { TutorInput } from '../contracts';
import { AppError } from '../errors/AppError';
import { tutorRepository } from '../repositories/tutorRepository';

export const tutorService = {
  listar() { return tutorRepository.listar(); },
  async buscar(id: number) {
    const tutor = await tutorRepository.buscar(id);
    if (!tutor) throw new AppError(404, 'Tutor não encontrado');
    return tutor;
  },
  criar(data: TutorInput) { return tutorRepository.criar(data); },
  editar(id: number, data: TutorInput) { return tutorRepository.editar(id, data); },
  async excluir(id: number) { await tutorRepository.excluir(id); },
};
