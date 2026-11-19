import type { ServicoInput } from '../contracts';
import { prisma } from '../lib/prisma';

type ServicoData = Omit<ServicoInput, 'descricao'> & { descricao: string | null };

export const servicoRepository = {
  listar() { return prisma.servico.findMany({ orderBy: { id: 'asc' } }); },
  buscar(id: number) { return prisma.servico.findUnique({ where: { id } }); },
  criar(data: ServicoData) { return prisma.servico.create({ data }); },
  editar(id: number, data: ServicoData) { return prisma.servico.update({ where: { id }, data }); },
  async possuiAgendamentos(id: number) {
    return (await prisma.agendamento.count({ where: { servicoId: id } })) > 0;
  },
  excluir(id: number) { return prisma.servico.delete({ where: { id } }); },
};
