import { useEffect, useState, type FormEvent } from 'react';

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';

import { agendamentoSchema, type StatusAgendamento } from '../contracts';
import {
  agendamentoService,
  type Agendamento,
} from '../services/agendamentoService';
import { animalService, type Animal } from '../services/animalService';
import { servicoService, type Servico } from '../services/servicoService';
import { errosApi, mensagemErro } from '../utils/apiError';
import { formatarDataHora, paraIsoDataHora, paraValorDataHora } from '../utils/data';
import AgendamentoModal, {
  type AgendamentoForm,
} from '../components/AgendamentoModal';

const formularioVazio: AgendamentoForm = {
  animalId: '',
  servicoId: '',
  dataHora: '',
  status: 'AGENDADO',
  observacoes: '',
};

const coresStatus: Record<StatusAgendamento, string> = {
  AGENDADO: 'blue',
  CONCLUIDO: 'green',
  CANCELADO: 'red',
};

const rotulosStatus: Record<StatusAgendamento, string> = {
  AGENDADO: 'Agendado',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroCarga, setErroCarga] = useState('');

  const [busca, setBusca] = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);

  const [agendamentoSelecionado, setAgendamentoSelecionado] =
    useState<Agendamento | null>(null);

  const [agendamentoParaExcluir, setAgendamentoParaExcluir] =
    useState<Agendamento | null>(null);

  const [formulario, setFormulario] =
    useState<AgendamentoForm>(formularioVazio);

  const [errosCampos, setErrosCampos] =
    useState<Record<string, string>>({});

  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] =
    useState<'success' | 'error' | null>(null);

  // Carrega agendamentos, animais e serviços ao mesmo tempo
  async function carregarDados() {
    try {
      setCarregando(true);
      setErroCarga('');

      const [listaAgendamentos, listaAnimais, listaServicos] =
        await Promise.all([
          agendamentoService.listar(),
          animalService.listar(),
          servicoService.listar(),
        ]);

      setAgendamentos(listaAgendamentos);
      setAnimais(listaAnimais);
      setServicos(listaServicos);

    } catch (error) {
      setErroCarga(mensagemErro(error, 'Não foi possível carregar os dados.'));

    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarDados();
  }, []);

  function alterarCampo(campo: keyof AgendamentoForm, valor: string) {
    setFormulario({ ...formulario, [campo]: valor });
  }

  // Abre o modal para cadastrar
  function abrirCadastro() {
    setAgendamentoSelecionado(null);
    setFormulario(formularioVazio);
    setErrosCampos({});
    setMensagem('');
    setTipoMensagem(null);
    setModalAberto(true);
  }

  // Abre o modal para editar
  function abrirEdicao(agendamento: Agendamento) {
    setAgendamentoSelecionado(agendamento);

    setFormulario({
      animalId: String(agendamento.animalId),
      servicoId: String(agendamento.servicoId),
      // ISO com fuso => valor local para o datetime-local
      dataHora: paraValorDataHora(agendamento.dataHora),
      status: agendamento.status,
      observacoes: agendamento.observacoes ?? '',
    });

    setErrosCampos({});
    setMensagem('');
    setTipoMensagem(null);
    setModalAberto(true);
  }

  // Salva um agendamento novo ou atualizado
  async function salvarAgendamento(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMensagem('');
    setTipoMensagem(null);
    setErrosCampos({});

    const novosErros: Record<string, string> = {};

    // Converte os IDs dos selects para número antes da validação
    const animalId = Number(formulario.animalId);
    const servicoId = Number(formulario.servicoId);

    if (!formulario.animalId || !Number.isInteger(animalId)) {
      novosErros.animalId = 'Selecione um animal';
    }

    if (!formulario.servicoId || !Number.isInteger(servicoId)) {
      novosErros.servicoId = 'Selecione um serviço';
    }

    // datetime-local (fuso local) => ISO 8601 com timezone
    const dataHora = paraIsoDataHora(formulario.dataHora);

    if (!dataHora) {
      novosErros.dataHora = 'Informe data e hora';
    }

    const status = formulario.status as StatusAgendamento;

    const validacao = agendamentoSchema.safeParse({
      animalId: animalId || 0,
      servicoId: servicoId || 0,
      dataHora: dataHora ?? '',
      status,
      observacoes: formulario.observacoes.trim() || null,
    });

    if (!validacao.success) {
      validacao.error.issues.forEach((issue) => {
        const campo = String(issue.path[0]);

        if (!novosErros[campo]) novosErros[campo] = issue.message;
      });
    }

    if (Object.keys(novosErros).length > 0 || !validacao.success) {
      setErrosCampos(novosErros);
      return;
    }

    try {
      setSalvando(true);

      if (agendamentoSelecionado) {
        await agendamentoService.editar(
          agendamentoSelecionado.id,
          validacao.data
        );

        setMensagem('Agendamento atualizado com sucesso!');

      } else {
        await agendamentoService.criar(validacao.data);

        setMensagem('Agendamento cadastrado com sucesso!');
      }

      setTipoMensagem('success');
      setModalAberto(false);

      await carregarDados();

    } catch (error) {
      setErrosCampos(errosApi(error));
      setMensagem(
        mensagemErro(error, 'Não foi possível salvar o agendamento.')
      );
      setTipoMensagem('error');

    } finally {
      setSalvando(false);
    }
  }

  // Exclui o agendamento selecionado
  async function excluirAgendamento() {
    if (!agendamentoParaExcluir) return;

    if (excluindo) return;
    setExcluindo(true);
    try {
      await agendamentoService.excluir(agendamentoParaExcluir.id);

      setModalExcluir(false);
      setAgendamentoParaExcluir(null);

      setMensagem('Agendamento excluído com sucesso!');
      setTipoMensagem('success');

      await carregarDados();

    } catch (error) {
      setMensagem(
        mensagemErro(error, 'Não foi possível excluir o agendamento.')
      );
      setTipoMensagem('error');

    } finally { setExcluindo(false); }
  }

  // Pesquisa local usando filter (animal, tutor, serviço ou status)
  const agendamentosFiltrados = agendamentos.filter((agendamento) => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');

    if (!termo) return true;

    return (
      agendamento.animal.nome.toLocaleLowerCase('pt-BR').includes(termo) ||
      agendamento.animal.tutor.nome.toLocaleLowerCase('pt-BR').includes(termo) ||
      agendamento.servico.nome.toLocaleLowerCase('pt-BR').includes(termo) ||
      rotulosStatus[agendamento.status].toLocaleLowerCase('pt-BR').includes(termo)
    );
  });

  return (
    <Stack gap="lg">

      {/* Cabeçalho */}
      <Group justify="space-between" align="center">
        <div>
          <Group gap="xs">
            <CalendarDays size={25} color="#087F72" />

            <Title order={2}>Agendamentos</Title>
          </Group>

          <Text size="sm" c="dimmed" mt={5}>
            Gerencie os horários de atendimento.
          </Text>
        </div>

        <Button
          color="teal"
          leftSection={<Plus size={18} />}
          onClick={abrirCadastro}
        >
          Novo agendamento
        </Button>
      </Group>

      {/* Mensagens */}
      {erroCarga && <Alert color="red" role="alert">{erroCarga}</Alert>}
      {mensagem && !modalAberto && !modalExcluir && (
        <Alert
          color={tipoMensagem === 'success' ? 'green' : 'red'}
          icon={
            tipoMensagem === 'success'
              ? <CheckCircle2 size={18} />
              : <AlertCircle size={18} />
          }
          withCloseButton
          onClose={() => setMensagem('')}
          role={tipoMensagem === 'success' ? 'status' : 'alert'}
        >
          {mensagem}
        </Alert>
      )}

      {/* Tabela */}
      <Paper withBorder radius="lg" p="md">

        <Group justify="space-between" mb="md">
          <div>
            <Title order={4}>Lista de agendamentos</Title>

            <Text size="xs" c="dimmed">
              {agendamentosFiltrados.length} registro(s) encontrado(s)
            </Text>
          </div>

          <TextInput
            aria-label="Pesquisar agendamentos"
            placeholder="Pesquisar animal, tutor, serviço..."
            leftSection={<Search size={17} />}
            value={busca}
            onChange={(event) => setBusca(event.currentTarget.value)}
            w={{ base: '100%', sm: 280 }}
          />
        </Group>

        {carregando ? (
          <Text c="dimmed" ta="center" py="xl">
            Carregando agendamentos...
          </Text>
        ) : erroCarga ? (
          <Text c="dimmed" ta="center" py="xl">Lista indisponível. Atualize a página para tentar novamente.</Text>
        ) : agendamentosFiltrados.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            {busca
              ? 'Nenhum agendamento encontrado para essa pesquisa.'
              : 'Ainda não existem agendamentos cadastrados.'}
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={760}>
            <Table verticalSpacing="md" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Data e hora</Table.Th>
                  <Table.Th>Animal</Table.Th>
                  <Table.Th>Tutor</Table.Th>
                  <Table.Th>Serviço</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th ta="center">Ações</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {agendamentosFiltrados.map((agendamento) => (
                  <Table.Tr key={agendamento.id}>
                    <Table.Td>
                      <Text fw={600}>
                        {formatarDataHora(agendamento.dataHora)}
                      </Text>
                    </Table.Td>

                    {/* Nomes vindos do include da API, sem adivinhar pelo id */}
                    <Table.Td>{agendamento.animal.nome}</Table.Td>

                    <Table.Td>{agendamento.animal.tutor.nome}</Table.Td>

                    <Table.Td>{agendamento.servico.nome}</Table.Td>

                    <Table.Td>
                      <Badge
                        color={coresStatus[agendamento.status]}
                        variant="light"
                      >
                        {rotulosStatus[agendamento.status]}
                      </Badge>
                    </Table.Td>

                    <Table.Td>
                      <Group justify="center" gap="xs">

                        <Tooltip label="Editar agendamento">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            aria-label="Editar agendamento"
                            onClick={() => abrirEdicao(agendamento)}
                          >
                            <Pencil size={17} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Excluir agendamento">
                          <ActionIcon
                            variant="light"
                            color="red"
                            aria-label="Excluir agendamento"
                            onClick={() => {
                              setAgendamentoParaExcluir(agendamento);
                              setMensagem('');
                              setTipoMensagem(null);
                              setModalExcluir(true);
                            }}
                          >
                            <Trash2 size={17} />
                          </ActionIcon>
                        </Tooltip>

                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>

      {/* Modal de cadastro e edição */}
      <AgendamentoModal
        aberto={modalAberto}
        salvando={salvando}
        agendamentoSelecionado={agendamentoSelecionado}
        formulario={formulario}
        errosCampos={errosCampos}
        mensagem={mensagem && tipoMensagem === 'error' ? mensagem : ''}
        animais={animais}
        servicos={servicos}
        onFechar={() => setModalAberto(false)}
        onAlterarCampo={alterarCampo}
        onSalvar={salvarAgendamento}
      />

      {/* Confirmação de exclusão */}
      <Modal
        opened={modalExcluir}
        onClose={() => { if (!excluindo) setModalExcluir(false); }}
        title="Excluir agendamento"
        centered
        size="sm"
      >
        <Stack gap="md">
          {mensagem && tipoMensagem === 'error' && <Alert color="red" role="alert">{mensagem}</Alert>}
          <Text size="sm">
            Deseja realmente excluir o agendamento de{' '}
            <strong>{agendamentoParaExcluir?.animal.nome}</strong>?
          </Text>

          <Group justify="flex-end">
            <Button
              variant="default"
              disabled={excluindo}
              onClick={() => setModalExcluir(false)}
            >
              Cancelar
            </Button>

            <Button
              color="red"
              leftSection={<Trash2 size={16} />}
              loading={excluindo}
              onClick={excluirAgendamento}
            >
              Excluir
            </Button>
          </Group>
        </Stack>
      </Modal>

    </Stack>
  );
}
