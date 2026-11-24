import { type FormEvent } from 'react';

import {
  Alert,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  TextInput,
  Textarea,
} from '@mantine/core';

import { AlertCircle } from 'lucide-react';

import { statusAgendamentos } from '../contracts';
import type { Agendamento } from '../services/agendamentoService';
import type { Animal } from '../services/animalService';
import type { Servico } from '../services/servicoService';

export type AgendamentoForm = {
  animalId: string;
  servicoId: string;
  dataHora: string;
  status: string;
  observacoes: string;
};

type AgendamentoModalProps = {
  aberto: boolean;
  salvando: boolean;
  agendamentoSelecionado: Agendamento | null;
  formulario: AgendamentoForm;
  errosCampos: Record<string, string>;
  mensagem: string;
  animais: Animal[];
  servicos: Servico[];
  onFechar: () => void;
  onAlterarCampo: (campo: keyof AgendamentoForm, valor: string) => void;
  onSalvar: (event: FormEvent<HTMLFormElement>) => void;
};

const rotulosStatus: Record<string, string> = {
  AGENDADO: 'Agendado',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

export default function AgendamentoModal({
  aberto,
  salvando,
  agendamentoSelecionado,
  formulario,
  errosCampos,
  mensagem,
  animais,
  servicos,
  onFechar,
  onAlterarCampo,
  onSalvar,
}: AgendamentoModalProps) {
  const opcoesAnimais = animais.map((animal) => ({
    value: String(animal.id),
    label: `${animal.nome} — ${animal.tutor.nome}`,
  }));

  const opcoesServicos = servicos.map((servico) => ({
    value: String(servico.id),
    label: servico.nome,
  }));

  const opcoesStatus = statusAgendamentos.map((status) => ({
    value: status,
    label: rotulosStatus[status],
  }));

  return (
    <Modal
      opened={aberto}
      onClose={() => { if (!salvando) onFechar(); }}
      title={agendamentoSelecionado ? 'Editar agendamento' : 'Cadastrar agendamento'}
      centered
    >
      <form noValidate onSubmit={onSalvar}>
        <Stack gap="md">
          {mensagem && <Alert color="red" icon={<AlertCircle size={18} />} role="alert">{mensagem}</Alert>}

          <Select
            label="Animal"
            placeholder="Selecione o animal"
            data={opcoesAnimais}
            value={formulario.animalId || null}
            onChange={(valor) => onAlterarCampo('animalId', valor ?? '')}
            error={errosCampos.animalId}
            searchable
            required
          />

          <Select
            label="Serviço"
            placeholder="Selecione o serviço"
            data={opcoesServicos}
            value={formulario.servicoId || null}
            onChange={(valor) => onAlterarCampo('servicoId', valor ?? '')}
            error={errosCampos.servicoId}
            searchable
            required
          />

          <TextInput
            label="Data e hora"
            type="datetime-local"
            value={formulario.dataHora}
            onChange={(event) => onAlterarCampo('dataHora', event.currentTarget.value)}
            error={errosCampos.dataHora}
            required
          />

          <Select
            label="Status"
            placeholder="Selecione o status"
            data={opcoesStatus}
            value={formulario.status}
            onChange={(valor) => onAlterarCampo('status', valor ?? '')}
            error={errosCampos.status}
            required
          />

          <Textarea
            label="Observações"
            placeholder="Observações sobre o atendimento (opcional)"
            autosize
            minRows={2}
            maxRows={4}
            value={formulario.observacoes}
            onChange={(event) => onAlterarCampo('observacoes', event.currentTarget.value)}
            error={errosCampos.observacoes}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" disabled={salvando} onClick={onFechar}>
              Cancelar
            </Button>

            <Button type="submit" color="teal" loading={salvando}>
              {agendamentoSelecionado ? 'Salvar alterações' : 'Cadastrar'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
