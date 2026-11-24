import { api } from './api';
import type { AgendamentoInput, StatusAgendamento } from '../contracts';

// Relações incluídas pela API (include do Prisma) para exibir nomes sem adivinhar pelo id
export type Agendamento = AgendamentoInput & {
  id: number;
  observacoes: string | null;
  status: StatusAgendamento;
  animal: {
    nome: string;
    tutor: {
      nome: string;
    };
  };
  servico: {
    nome: string;
  };
  criadoEm?: string;
};

export const agendamentoService = {
  async listar(): Promise<Agendamento[]> {
    const resposta = await api.get<Agendamento[]>('/agendamentos');
    return resposta.data;
  },

  async buscar(id: number): Promise<Agendamento> {
    const resposta = await api.get<Agendamento>(`/agendamentos/${id}`);
    return resposta.data;
  },

  async criar(dados: AgendamentoInput): Promise<Agendamento> {
    const resposta = await api.post<Agendamento>('/agendamentos', dados);
    return resposta.data;
  },

  async editar(id: number, dados: AgendamentoInput): Promise<Agendamento> {
    const resposta = await api.put<Agendamento>(`/agendamentos/${id}`, dados);
    return resposta.data;
  },

  async excluir(id: number): Promise<void> {
    await api.delete(`/agendamentos/${id}`);
  },
};
