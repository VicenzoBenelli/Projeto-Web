import type { AgendamentoInput } from '../contracts';
import { AppError } from '../errors/AppError';
import { agendamentoRepository } from '../repositories/agendamentoRepository';
import { animalRepository } from '../repositories/animalRepository';
import { servicoRepository } from '../repositories/servicoRepository';

type AgendamentoData = Omit<AgendamentoInput, 'dataHora' | 'observacoes'> & {
  dataHora: Date;
  observacoes: string | null;
};

async function validarRelacionamentos(data: AgendamentoInput): Promise<void> {
  if (!(await animalRepository.buscar(data.animalId))) {
    throw new AppError(409, 'Animal informado não encontrado');
  }
  if (!(await servicoRepository.buscar(data.servicoId))) {
    throw new AppError(409, 'Serviço informado não encontrado');
  }
}

function prepararDados(data: AgendamentoInput): AgendamentoData {
  return {
    ...data,
    dataHora: new Date(data.dataHora),
    observacoes: data.observacoes ?? null,
  };
}

export const agendamentoService = {
  listar() { return agendamentoRepository.listar(); },
  async buscar(id: number) {
    const agendamento = await agendamentoRepository.buscar(id);
    if (!agendamento) throw new AppError(404, 'Agendamento não encontrado');
    return agendamento;
  },
  async criar(data: AgendamentoInput) {
    await validarRelacionamentos(data);
    return agendamentoRepository.criar(prepararDados(data));
  },
  async editar(id: number, data: AgendamentoInput) {
    if (!(await agendamentoRepository.buscar(id))) {
      throw new AppError(404, 'Agendamento não encontrado');
    }
    await validarRelacionamentos(data);
    return agendamentoRepository.editar(id, prepararDados(data));
  },
  async excluir(id: number) {
    if (!(await agendamentoRepository.buscar(id))) {
      throw new AppError(404, 'Agendamento não encontrado');
    }
    await agendamentoRepository.excluir(id);
  },
};
