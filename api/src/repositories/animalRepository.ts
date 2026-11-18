import type { AnimalInput } from '../contracts';
import { prisma } from '../lib/prisma';

const includeTutor = { tutor: { select: { id: true, nome: true } } } as const;
type AnimalData = Omit<AnimalInput, 'raca'> & { raca: string | null };

export const animalRepository = {
  listar() { return prisma.animal.findMany({ include: includeTutor, orderBy: { id: 'asc' } }); },
  buscar(id: number) { return prisma.animal.findUnique({ where: { id }, include: includeTutor }); },
  criar(data: AnimalData) { return prisma.animal.create({ data, include: includeTutor }); },
  editar(id: number, data: AnimalData) {
    return prisma.animal.update({ where: { id }, data, include: includeTutor });
  },
  excluir(id: number) { return prisma.animal.delete({ where: { id } }); },
};
