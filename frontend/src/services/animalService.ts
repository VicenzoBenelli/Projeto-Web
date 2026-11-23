
import { api } from './api';
import type { AnimalInput } from '../contracts';

// Informações do tutor que acompanham o animal
export type Animal = AnimalInput & {
  id: number;
  raca: string | null;
  tutorId: number;
  tutor: {
    id: number;
    nome: string;
  };
};

export const animalService = {
  async listar(): Promise<Animal[]> {
    const resposta = await api.get<Animal[]>('/animais');
    return resposta.data;
  },

  async buscar(id: number): Promise<Animal> {
    const resposta = await api.get<Animal>(`/animais/${id}`);
    return resposta.data;
  },

  async criar(dados: AnimalInput): Promise<Animal> {
    const resposta = await api.post<Animal>('/animais', dados);
    return resposta.data;
  },

  async editar(id: number, dados: AnimalInput): Promise<Animal> {
    const resposta = await api.put<Animal>(`/animais/${id}`, dados);
    return resposta.data;
  },

  async excluir(id: number): Promise<void> {
    await api.delete(`/animais/${id}`);
  },
};
