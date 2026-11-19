import type { ServicoInput } from '../contracts';
import { AppError } from '../errors/AppError';
import { servicoRepository } from '../repositories/servicoRepository';

export const servicoService = {
  listar() { return servicoRepository.listar(); },
  async buscar(id: number) {
    const servico = await servicoRepository.buscar(id);
    if (!servico) throw new AppError(404, 'Serviço não encontrado');
    return servico;
  },
  criar(data: ServicoInput) {
    return servicoRepository.criar({ ...data, descricao: data.descricao ?? null });
  },
  editar(id: number, data: ServicoInput) {
    return servicoRepository.editar(id, { ...data, descricao: data.descricao ?? null });
  },
  async excluir(id: number) {
    if (!(await servicoRepository.buscar(id))) throw new AppError(404, 'Serviço não encontrado');
    if (await servicoRepository.possuiAgendamentos(id)) {
      throw new AppError(409, 'Não é possível excluir serviço com agendamentos vinculados');
    }
    await servicoRepository.excluir(id);
  },
};
