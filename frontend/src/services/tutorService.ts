
import { api } from './api';
import type { TutorInput } from '../contracts';

// Dados que vêm do banco
export type Tutor = TutorInput & {
  id: number;
  criadoEm?: string;
};

export const tutorService = {
  async listar(): Promise<Tutor[]> {
    const resposta = await api.get<Tutor[]>('/tutores');
    return resposta.data;
  },

  async buscar(id: number): Promise<Tutor> {
    const resposta = await api.get<Tutor>(`/tutores/${id}`);
    return resposta.data;
  },

  async criar(dados: TutorInput): Promise<Tutor> {
    const resposta = await api.post<Tutor>('/tutores', dados);
    return resposta.data;
  },

  async editar(id: number, dados: TutorInput): Promise<Tutor> {
    const resposta = await api.put<Tutor>(`/tutores/${id}`, dados);
    return resposta.data;
  },

  async excluir(id: number): Promise<void> {
    await api.delete(`/tutores/${id}`);
  },
};
