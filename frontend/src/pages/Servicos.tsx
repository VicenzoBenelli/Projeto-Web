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
  Title,
  Tooltip,
} from '@mantine/core';

import {
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Scissors,
} from 'lucide-react';

import { servicoSchema } from '../contracts';
import { servicoService, type Servico } from '../services/servicoService';
import { errosApi, mensagemErro } from '../utils/apiError';
import { formatarBRL, formatarEntradaMoeda, paraCentavos } from '../utils/moeda';
import ServicoModal, { type ServicoForm } from '../components/ServicoModal';

const formularioVazio: ServicoForm = {
  nome: '',
  descricao: '',
  preco: '',
  duracaoMinutos: '',
};

export default function Servicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroCarga, setErroCarga] = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);

  const [servicoSelecionado, setServicoSelecionado] =
    useState<Servico | null>(null);

  const [servicoParaExcluir, setServicoParaExcluir] =
    useState<Servico | null>(null);

  const [formulario, setFormulario] =
    useState<ServicoForm>(formularioVazio);

  const [errosCampos, setErrosCampos] =
    useState<Record<string, string>>({});

  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] =
    useState<'success' | 'error' | null>(null);

  // Busca os serviços na API
  async function carregarServicos() {
    try {
      setCarregando(true);
      setErroCarga('');

      const dados = await servicoService.listar();

      setServicos(dados);

    } catch (error) {
      setErroCarga(mensagemErro(error, 'Não foi possível carregar os dados.'));

    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarServicos();
  }, []);

  function alterarCampo(campo: keyof ServicoForm, valor: string) {
    // O preço ganha máscara progressiva de moeda enquanto o usuário digita.
    if (campo === 'preco') {
      setFormulario({ ...formulario, preco: formatarEntradaMoeda(valor) });
      return;
    }

    setFormulario({ ...formulario, [campo]: valor });
  }

  // Abre o modal para cadastrar
  function abrirCadastro() {
    setServicoSelecionado(null);
    setFormulario(formularioVazio);
    setErrosCampos({});
    setMensagem('');
    setTipoMensagem(null);
    setModalAberto(true);
  }

  // Abre o modal para editar
  function abrirEdicao(servico: Servico) {
    setServicoSelecionado(servico);

    setFormulario({
      nome: servico.nome,
      descricao: servico.descricao ?? '',
      // Exibe em reais para edição: 5000 => "50,00"
      preco: formatarEntradaMoeda(String(servico.precoCentavos)),
      duracaoMinutos: String(servico.duracaoMinutos),
    });

    setErrosCampos({});
    setMensagem('');
    setTipoMensagem(null);
    setModalAberto(true);
  }

  // Salva um serviço novo ou atualizado
  async function salvarServico(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMensagem('');
    setTipoMensagem(null);
    setErrosCampos({});

    // Converte a entrada em reais para centavos inteiros de modo controlado;
    // nenhum valor com vírgula trafega para a API.
    const precoCentavos = paraCentavos(formulario.preco);
    const duracaoMinutos = Number(formulario.duracaoMinutos.replace(/\D/g, ''));

    const novosErros: Record<string, string> = {};

    if (precoCentavos === null) {
      novosErros.precoCentavos = 'Informe um preço válido em reais';
    }

    if (!Number.isInteger(duracaoMinutos) || duracaoMinutos <= 0) {
      novosErros.duracaoMinutos = 'Informe a duração em minutos';
    }

    const validacao = servicoSchema.safeParse({
      nome: formulario.nome,
      descricao: formulario.descricao.trim() || null,
      precoCentavos: precoCentavos ?? 0,
      duracaoMinutos: duracaoMinutos || 0,
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

      if (servicoSelecionado) {
        await servicoService.editar(servicoSelecionado.id, validacao.data);

        setMensagem('Serviço atualizado com sucesso!');

      } else {
        await servicoService.criar(validacao.data);

        setMensagem('Serviço cadastrado com sucesso!');
      }

      setTipoMensagem('success');
      setModalAberto(false);

      await carregarServicos();

    } catch (error) {
      setErrosCampos(errosApi(error));
      setMensagem(
        mensagemErro(error, 'Não foi possível salvar o serviço.')
      );
      setTipoMensagem('error');

    } finally {
      setSalvando(false);
    }
  }

  // Exclui o serviço selecionado
  async function excluirServico() {
    if (!servicoParaExcluir) return;

    if (excluindo) return;
    setExcluindo(true);
    try {
      await servicoService.excluir(servicoParaExcluir.id);

      setModalExcluir(false);
      setServicoParaExcluir(null);

      setMensagem('Serviço excluído com sucesso!');
      setTipoMensagem('success');

      await carregarServicos();

    } catch (error) {
      setMensagem(
        mensagemErro(error, 'Não foi possível excluir o serviço.')
      );
      setTipoMensagem('error');

    } finally { setExcluindo(false); }
  }

  return (
    <Stack gap="lg">

      {/* Cabeçalho */}
      <Group justify="space-between" align="center">
        <div>
          <Group gap="xs">
            <Scissors size={25} color="#087F72" />

            <Title order={2}>Serviços</Title>
          </Group>

          <Text size="sm" c="dimmed" mt={5}>
            Gerencie os serviços oferecidos pelo pet shop.
          </Text>
        </div>

        <Button
          color="teal"
          leftSection={<Plus size={18} />}
          onClick={abrirCadastro}
        >
          Novo serviço
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
            <Title order={4}>Lista de serviços</Title>

            <Text size="xs" c="dimmed">
              {servicos.length} registro(s) encontrado(s)
            </Text>
          </div>
        </Group>

        {carregando ? (
          <Text c="dimmed" ta="center" py="xl">
            Carregando serviços...
          </Text>
        ) : erroCarga ? (
          <Text c="dimmed" ta="center" py="xl">Lista indisponível. Atualize a página para tentar novamente.</Text>
        ) : servicos.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            Ainda não existem serviços cadastrados.
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={650}>
            <Table verticalSpacing="md" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nome</Table.Th>
                  <Table.Th>Descrição</Table.Th>
                  <Table.Th>Duração</Table.Th>
                  <Table.Th>Preço</Table.Th>
                  <Table.Th ta="center">Ações</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {servicos.map((servico) => (
                  <Table.Tr key={servico.id}>
                    <Table.Td>
                      <Text fw={600}>{servico.nome}</Text>
                    </Table.Td>

                    <Table.Td>
                      {servico.descricao || '—'}
                    </Table.Td>

                    <Table.Td>
                      {servico.duracaoMinutos} min
                    </Table.Td>

                    <Table.Td>
                      {/* precoCentavos/100 formatado em BRL */}
                      {formatarBRL(servico.precoCentavos)}
                    </Table.Td>

                    <Table.Td>
                      <Group justify="center" gap="xs">

                        <Tooltip label="Editar serviço">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            aria-label="Editar serviço"
                            onClick={() => abrirEdicao(servico)}
                          >
                            <Pencil size={17} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Excluir serviço">
                          <ActionIcon
                            variant="light"
                            color="red"
                            aria-label="Excluir serviço"
                            onClick={() => {
                              setServicoParaExcluir(servico);
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
      <ServicoModal
        aberto={modalAberto}
        salvando={salvando}
        servicoSelecionado={servicoSelecionado}
        formulario={formulario}
        errosCampos={errosCampos}
        mensagem={mensagem && tipoMensagem === 'error' ? mensagem : ''}
        onFechar={() => setModalAberto(false)}
        onAlterarCampo={alterarCampo}
        onSalvar={salvarServico}
      />

      {/* Confirmação de exclusão */}
      <Modal
        opened={modalExcluir}
        onClose={() => { if (!excluindo) setModalExcluir(false); }}
        title="Excluir serviço"
        centered
        size="sm"
      >
        <Stack gap="md">
          {mensagem && tipoMensagem === 'error' && <Alert color="red" role="alert">{mensagem}</Alert>}
          <Text size="sm">
            Deseja realmente excluir o serviço{' '}
            <strong>{servicoParaExcluir?.nome}</strong>?
          </Text>

          <Text size="xs" c="dimmed">
            A exclusão não será permitida caso existam agendamentos
            vinculados a esse serviço.
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
              onClick={excluirServico}
            >
              Excluir
            </Button>
          </Group>
        </Stack>
      </Modal>

    </Stack>
  );
}
