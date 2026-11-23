
import { useEffect, useState, type FormEvent } from 'react';

import {
  ActionIcon,
  Alert,
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
  Users,
} from 'lucide-react';

import { matchesTutor } from '../utils/search';
import { tutorSchema } from '../contracts';
import { tutorService, type Tutor } from '../services/tutorService';
import { errosApi, mensagemErro } from '../utils/apiError';

type TutorForm = {
  nome: string;
  cpf: string;
  telefone: string;
};

const formularioVazio: TutorForm = {
  nome: '',
  cpf: '',
  telefone: '',
};

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, '');
}

function formatarCpf(valor: string) {
  const cpf = somenteNumeros(valor);

  if (cpf.length !== 11) return valor;

  return cpf.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    '$1.$2.$3-$4'
  );
}

function formatarTelefone(valor: string) {
  const telefone = somenteNumeros(valor);

  if (telefone.length === 11) {
    return telefone.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      '($1) $2-$3'
    );
  }

  if (telefone.length === 10) {
    return telefone.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      '($1) $2-$3'
    );
  }

  return valor;
}

export default function Tutores() {
  const [tutores, setTutores] = useState<Tutor[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroCarga, setErroCarga] = useState('');

  const [busca, setBusca] = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);

  const [tutorSelecionado, setTutorSelecionado] =
    useState<Tutor | null>(null);

  const [tutorParaExcluir, setTutorParaExcluir] =
    useState<Tutor | null>(null);

  const [formulario, setFormulario] =
    useState<TutorForm>(formularioVazio);

  const [errosCampos, setErrosCampos] =
    useState<Record<string, string>>({});

  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] =
    useState<'success' | 'error' | null>(null);

  // Busca os tutores na API
  async function carregarTutores() {
    try {
      setCarregando(true);
      setErroCarga('');

      const dados = await tutorService.listar();

      setTutores(dados);


    } catch (error) {
      setErroCarga(mensagemErro(error, 'Não foi possível carregar os dados.'));

    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarTutores();
  }, []);

  // Abre o modal para cadastrar
  function abrirCadastro() {
    setTutorSelecionado(null);
    setFormulario(formularioVazio);
    setErrosCampos({});
    setMensagem('');
    setTipoMensagem(null);
    setModalAberto(true);
  }

  // Abre o modal para editar
  function abrirEdicao(tutor: Tutor) {
    setTutorSelecionado(tutor);

    setFormulario({
      nome: tutor.nome,
      cpf: tutor.cpf,
      telefone: tutor.telefone,
    });

    setErrosCampos({});
    setMensagem('');
    setTipoMensagem(null);
    setModalAberto(true);
  }

  // Salva um tutor novo ou atualizado
  async function salvarTutor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMensagem('');
    setTipoMensagem(null);
    setErrosCampos({});

    const validacao = tutorSchema.safeParse({
      nome: formulario.nome,
      cpf: somenteNumeros(formulario.cpf),
      telefone: somenteNumeros(formulario.telefone),
    });

    if (!validacao.success) {
      const novosErros: Record<string, string> = {};

      validacao.error.issues.forEach((issue) => {
        const campo = String(issue.path[0]);
        novosErros[campo] = issue.message;
      });

      setErrosCampos(novosErros);
      return;
    }

    try {
      setSalvando(true);

      if (tutorSelecionado) {
        await tutorService.editar(
          tutorSelecionado.id,
          validacao.data
        );

        setMensagem('Tutor atualizado com sucesso!');

      } else {
        await tutorService.criar(validacao.data);

        setMensagem('Tutor cadastrado com sucesso!');
      }

      setTipoMensagem('success');
      setModalAberto(false);

      await carregarTutores();

    } catch (error) {
      setErrosCampos(errosApi(error));
      setMensagem(
        mensagemErro(error, 'Não foi possível salvar o tutor.')
      );
      setTipoMensagem('error');

    } finally {
      setSalvando(false);
    }
  }

  // Exclui o tutor selecionado
  async function excluirTutor() {
    if (!tutorParaExcluir) return;

    if (excluindo) return;
    setExcluindo(true);
    try {
      await tutorService.excluir(tutorParaExcluir.id);

      setModalExcluir(false);
      setTutorParaExcluir(null);

      setMensagem('Tutor excluído com sucesso!');
      setTipoMensagem('success');

      await carregarTutores();

    } catch (error) {
      setMensagem(
        mensagemErro(error, 'Não foi possível excluir o tutor.')
      );
      setTipoMensagem('error');

    } finally { setExcluindo(false); }
  }

  // Pesquisa local usando filter
  const tutoresFiltrados = tutores.filter(tutor => matchesTutor(tutor, busca));

  return (
    <Stack gap="lg">

      {/* Cabeçalho */}
      <Group justify="space-between" align="center">
        <div>
          <Group gap="xs">
            <Users size={25} color="#087F72" />

            <Title order={2}>Tutores</Title>
          </Group>

          <Text size="sm" c="dimmed" mt={5}>
            Gerencie os responsáveis pelos animais.
          </Text>
        </div>

        <Button
          color="teal"
          leftSection={<Plus size={18} />}
          onClick={abrirCadastro}
        >
          Novo tutor
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
            <Title order={4}>Lista de tutores</Title>

            <Text size="xs" c="dimmed">
              {tutoresFiltrados.length} registro(s) encontrado(s)
            </Text>
          </div>

          <TextInput
            aria-label="Pesquisar tutores"
            placeholder="Pesquisar nome ou CPF..."
            leftSection={<Search size={17} />}
            value={busca}
            onChange={(event) => setBusca(event.currentTarget.value)}
            w={{ base: '100%', sm: 280 }}
          />
        </Group>

        {carregando ? (
          <Text c="dimmed" ta="center" py="xl">
            Carregando tutores...
          </Text>
        ) : erroCarga ? (
          <Text c="dimmed" ta="center" py="xl">Lista indisponível. Atualize a página para tentar novamente.</Text>
        ) : tutoresFiltrados.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            {busca
              ? 'Nenhum tutor encontrado para essa pesquisa.'
              : 'Ainda não existem tutores cadastrados.'}
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={650}>
            <Table verticalSpacing="md" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nome</Table.Th>
                  <Table.Th>CPF</Table.Th>
                  <Table.Th>Telefone</Table.Th>
                  <Table.Th ta="center">Ações</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {tutoresFiltrados.map((tutor) => (
                  <Table.Tr key={tutor.id}>
                    <Table.Td>
                      <Text fw={600}>{tutor.nome}</Text>
                    </Table.Td>

                    <Table.Td>
                      {formatarCpf(tutor.cpf)}
                    </Table.Td>

                    <Table.Td>
                      {formatarTelefone(tutor.telefone)}
                    </Table.Td>

                    <Table.Td>
                      <Group justify="center" gap="xs">

                        <Tooltip label="Editar tutor">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            aria-label="Editar tutor"
                            onClick={() => abrirEdicao(tutor)}
                          >
                            <Pencil size={17} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Excluir tutor">
                          <ActionIcon
                            variant="light"
                            color="red"
                            aria-label="Excluir tutor"
                            onClick={() => {
                              setTutorParaExcluir(tutor);
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
      <Modal
        opened={modalAberto}
        onClose={() => { if (!salvando) setModalAberto(false); }}
        title={tutorSelecionado ? 'Editar tutor' : 'Cadastrar tutor'}
        centered
      >
        <form noValidate onSubmit={salvarTutor}>
          <Stack gap="md">
            {mensagem && tipoMensagem === 'error' && <Alert color="red" role="alert">{mensagem}</Alert>}

            <TextInput
              label="Nome completo"
              placeholder="Digite o nome do tutor"
              value={formulario.nome}
              onChange={(event) =>
                setFormulario({
                  ...formulario,
                  nome: event.currentTarget.value,
                })
              }
              error={errosCampos.nome}
              required
            />

            <TextInput
              label="CPF"
              placeholder="Somente números"
              maxLength={14}
              value={formulario.cpf}
              onChange={(event) =>
                setFormulario({
                  ...formulario,
                  cpf: event.currentTarget.value,
                })
              }
              error={errosCampos.cpf}
              required
            />

            <TextInput
              label="Telefone"
              placeholder="(83) 99999-9999"
              maxLength={15}
              value={formulario.telefone}
              onChange={(event) =>
                setFormulario({
                  ...formulario,
                  telefone: event.currentTarget.value,
                })
              }
              error={errosCampos.telefone}
              required
            />

            <Group justify="flex-end" mt="md">
              <Button
                variant="default"
                disabled={salvando}
                onClick={() => setModalAberto(false)}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                color="teal"
                loading={salvando}
              >
                {tutorSelecionado ? 'Salvar alterações' : 'Cadastrar'}
              </Button>
            </Group>

          </Stack>
        </form>
      </Modal>

      {/* Confirmação de exclusão */}
      <Modal
        opened={modalExcluir}
        onClose={() => { if (!excluindo) setModalExcluir(false); }}
        title="Excluir tutor"
        centered
        size="sm"
      >
        <Stack gap="md">
          {mensagem && tipoMensagem === 'error' && <Alert color="red" role="alert">{mensagem}</Alert>}
          <Text size="sm">
            Deseja realmente excluir o tutor{' '}
            <strong>{tutorParaExcluir?.nome}</strong>?
          </Text>

          <Text size="xs" c="dimmed">
            A exclusão não será permitida caso existam animais
            vinculados a esse tutor.
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
              onClick={excluirTutor}
            >
              Excluir
            </Button>
          </Group>
        </Stack>
      </Modal>

    </Stack>
  );
}
