import type { AgendamentoInput } from '../contracts';
import { prisma } from '../lib/prisma';

type AgendamentoData = Omit<AgendamentoInput, 'dataHora' | 'observacoes'> & {
  dataHora: Date;
  observacoes: string | null;
};

const includeRelacoes = {
  animal: { select: { nome: true, tutor: { select: { nome: true } } } },
  servico: { select: { nome: true } },
} as const;

export const agendamentoRepository = {
  listar() {
    return prisma.agendamento.findMany({ include: includeRelacoes, orderBy: { id: 'asc' } });
  },
  buscar(id: number) {
    return prisma.agendamento.findUnique({ where: { id }, include: includeRelacoes });
  },
  criar(data: AgendamentoData) {
    return prisma.agendamento.create({ data, include: includeRelacoes });
  },
  editar(id: number, data: AgendamentoData) {
    return prisma.agendamento.update({ where: { id }, data, include: includeRelacoes });
  },
  excluir(id: number) { return prisma.agendamento.delete({ where: { id } }); },
};
