import type { TutorInput } from '../contracts';
import { prisma } from '../lib/prisma';

export const tutorRepository = {
  listar() { return prisma.tutor.findMany({ orderBy: { id: 'asc' } }); },
  buscar(id: number) { return prisma.tutor.findUnique({ where: { id } }); },
  criar(data: TutorInput) { return prisma.tutor.create({ data }); },
  editar(id: number, data: TutorInput) { return prisma.tutor.update({ where: { id }, data }); },
  excluir(id: number) { return prisma.tutor.delete({ where: { id } }); },
};
