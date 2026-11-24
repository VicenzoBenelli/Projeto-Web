import { type FormEvent } from 'react';

import {
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  TextInput,
  Textarea,
} from '@mantine/core';

import { AlertCircle } from 'lucide-react';

import type { Servico } from '../services/servicoService';

export type ServicoForm = {
  nome: string;
  descricao: string;
  preco: string;
  duracaoMinutos: string;
};

type ServicoModalProps = {
  aberto: boolean;
  salvando: boolean;
  servicoSelecionado: Servico | null;
  formulario: ServicoForm;
  errosCampos: Record<string, string>;
  mensagem: string;
  onFechar: () => void;
  onAlterarCampo: (campo: keyof ServicoForm, valor: string) => void;
  onSalvar: (event: FormEvent<HTMLFormElement>) => void;
};

export default function ServicoModal({
  aberto,
  salvando,
  servicoSelecionado,
  formulario,
  errosCampos,
  mensagem,
  onFechar,
  onAlterarCampo,
  onSalvar,
}: ServicoModalProps) {
  return (
    <Modal
      opened={aberto}
      onClose={() => { if (!salvando) onFechar(); }}
      title={servicoSelecionado ? 'Editar serviço' : 'Cadastrar serviço'}
      centered
    >
      <form noValidate onSubmit={onSalvar}>
        <Stack gap="md">
          {mensagem && <Alert color="red" icon={<AlertCircle size={18} />} role="alert">{mensagem}</Alert>}

          <TextInput
            label="Nome"
            placeholder="Digite o nome do serviço"
            value={formulario.nome}
            onChange={(event) => onAlterarCampo('nome', event.currentTarget.value)}
            error={errosCampos.nome}
            required
          />

          <Textarea
            label="Descrição"
            placeholder="Descreva o serviço (opcional)"
            autosize
            minRows={2}
            maxRows={4}
            value={formulario.descricao}
            onChange={(event) => onAlterarCampo('descricao', event.currentTarget.value)}
            error={errosCampos.descricao}
          />

          <TextInput
            label="Preço (R$)"
            placeholder="0,00"
            inputMode="decimal"
            value={formulario.preco}
            onChange={(event) => onAlterarCampo('preco', event.currentTarget.value)}
            error={errosCampos.precoCentavos}
            required
          />

          <TextInput
            label="Duração (minutos)"
            placeholder="Ex.: 30"
            inputMode="numeric"
            value={formulario.duracaoMinutos}
            onChange={(event) => onAlterarCampo('duracaoMinutos', event.currentTarget.value)}
            error={errosCampos.duracaoMinutos}
            required
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" disabled={salvando} onClick={onFechar}>
              Cancelar
            </Button>

            <Button type="submit" color="teal" loading={salvando}>
              {servicoSelecionado ? 'Salvar alterações' : 'Cadastrar'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
