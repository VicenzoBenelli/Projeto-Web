import { api } from './api';
import type { ServicoInput } from '../contracts';

// Dados que vêm do banco
export type Servico = ServicoInput & {
  id: number;
  descricao: string | null;
  criadoEm?: string;
};

export const servicoService = {
  async listar(): Promise<Servico[]> {
    const resposta = await api.get<Servico[]>('/servicos');
    return resposta.data;
  },

  async buscar(id: number): Promise<Servico> {
    const resposta = await api.get<Servico>(`/servicos/${id}`);
    return resposta.data;
  },

  async criar(dados: ServicoInput): Promise<Servico> {
    const resposta = await api.post<Servico>('/servicos', dados);
    return resposta.data;
  },

  async editar(id: number, dados: ServicoInput): Promise<Servico> {
    const resposta = await api.put<Servico>(`/servicos/${id}`, dados);
    return resposta.data;
  },

  async excluir(id: number): Promise<void> {
    await api.delete(`/servicos/${id}`);
  },
};
