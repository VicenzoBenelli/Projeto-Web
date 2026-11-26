
import { useEffect, useState, type FormEvent } from 'react';

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  Select,
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
  PawPrint,
} from 'lucide-react';

import { animalSchema } from '../contracts';

import {
  animalService,
  type Animal,
} from '../services/animalService';

import {
  tutorService,
  type Tutor,
} from '../services/tutorService';

import { errosApi, mensagemErro } from '../utils/apiError';

type AnimalForm = {
  nome: string;
  especie: Animal['especie'];
  raca: string;
  tutorId: string;
};

const formularioVazio: AnimalForm = {
  nome: '',
  especie: 'CACHORRO',
  raca: '',
  tutorId: '',
};

const especies = [
  { value: 'CACHORRO', label: 'Cachorro' },
  { value: 'GATO', label: 'Gato' },
  { value: 'OUTRO', label: 'Outro' },
];

function nomeEspecie(especie: Animal['especie']) {
  const nomes = {
    CACHORRO: 'Cachorro',
    GATO: 'Gato',
    OUTRO: 'Outro',
  };

  return nomes[especie];
}

export default function Animais() {
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [tutores, setTutores] = useState<Tutor[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroCarga, setErroCarga] = useState('');

  const [busca, setBusca] = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);

  const [animalSelecionado, setAnimalSelecionado] =
    useState<Animal | null>(null);

  const [animalParaExcluir, setAnimalParaExcluir] =
    useState<Animal | null>(null);

  const [formulario, setFormulario] =
    useState<AnimalForm>(formularioVazio);

  const [errosCampos, setErrosCampos] =
    useState<Record<string, string>>({});

  const [mensagem, setMensagem] = useState('');

  const [tipoMensagem, setTipoMensagem] =
    useState<'success' | 'error' | null>(null);

  // Carrega animais e tutores ao mesmo tempo
  async function carregarDados() {
    try {
      setCarregando(true);
      setErroCarga('');

      const [listaAnimais, listaTutores] = await Promise.all([
        animalService.listar(),
        tutorService.listar(),
      ]);

      setAnimais(listaAnimais);
      setTutores(listaTutores);

    } catch (error) {
      setErroCarga(mensagemErro(error, 'Não foi possível carregar os dados.'));

    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarDados();
  }, []);

  // Abre cadastro
  function abrirCadastro() {
    setAnimalSelecionado(null);
    setFormulario(formularioVazio);
    setErrosCampos({});
    setMensagem('');
    setTipoMensagem(null);
    setModalAberto(true);
  }

  // Abre edição
  function abrirEdicao(animal: Animal) {
    setAnimalSelecionado(animal);

    setFormulario({
      nome: animal.nome,
      especie: animal.especie,
      raca: animal.raca ?? '',
      tutorId: String(animal.tutorId),
    });

    setErrosCampos({});
    setMensagem('');
    setTipoMensagem(null);
    setModalAberto(true);
  }

  // Salva um animal
  async function salvarAnimal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (salvando) return;

    setMensagem('');
    setErrosCampos({});
    setTipoMensagem(null);

    const validacao = animalSchema.safeParse({
      nome: formulario.nome,
      especie: formulario.especie,
      raca: formulario.raca.trim() || null,
      tutorId: Number(formulario.tutorId),
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

      if (animalSelecionado) {
        await animalService.editar(
          animalSelecionado.id,
          validacao.data
        );

        setMensagem('Animal atualizado com sucesso!');

      } else {
        await animalService.criar(validacao.data);

        setMensagem('Animal cadastrado com sucesso!');
      }

      setTipoMensagem('success');
      setModalAberto(false);

      await carregarDados();

    } catch (error) {
      setErrosCampos(errosApi(error));
      setMensagem(
        mensagemErro(error, 'Não foi possível salvar o animal.')
      );

      setTipoMensagem('error');

    } finally {
      setSalvando(false);
    }
  }

  // Exclui um animal
  async function excluirAnimal() {
    if (!animalParaExcluir) return;

    if (excluindo) return;
    setExcluindo(true);
    try {
      await animalService.excluir(animalParaExcluir.id);

      setModalExcluir(false);
      setAnimalParaExcluir(null);

      setMensagem('Animal excluído com sucesso!');
      setTipoMensagem('success');

      await carregarDados();

    } catch (error) {
      setMensagem(
        mensagemErro(error, 'Não foi possível excluir o animal.')
      );

      setTipoMensagem('error');
    } finally { setExcluindo(false); }
  }

  // Busca local por nome, raça ou tutor
  const animaisFiltrados = animais.filter((animal) => {
    const termo = busca.toLocaleLowerCase('pt-BR');

    return (
      animal.nome.toLocaleLowerCase('pt-BR').includes(termo) ||
      (animal.raca ?? '').toLocaleLowerCase('pt-BR').includes(termo) ||
      animal.tutor.nome.toLocaleLowerCase('pt-BR').includes(termo)
    );
  });

  const opcoesTutores = tutores.map((tutor) => ({
    value: String(tutor.id),
    label: `${tutor.nome} — CPF ${tutor.cpf}`,
  }));

  return (
    <Stack gap="lg">

      {/* Cabeçalho */}
      <Group justify="space-between" align="center">
        <div>
          <Group gap="xs">
            <PawPrint size={25} color="#087F72" />

            <Title order={2}>Animais</Title>
          </Group>

          <Text size="sm" c="dimmed" mt={5}>
            Gerencie os animais cadastrados no PetCare.
          </Text>
        </div>

        <Button
          color="teal"
          leftSection={<Plus size={18} />}
          onClick={abrirCadastro}
          disabled={carregando || !!erroCarga || tutores.length === 0}
        >
          Novo animal
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

      {!carregando && !erroCarga && tutores.length === 0 && (
        <Alert color="yellow" title="Nenhum tutor cadastrado">
          Para cadastrar um animal, primeiro cadastre pelo menos
          um tutor na tela de Tutores.
        </Alert>
      )}

      {/* Listagem */}
      <Paper withBorder radius="lg" p="md">

        <Group justify="space-between" mb="md">
          <div>
            <Title order={4}>Lista de animais</Title>

            <Text size="xs" c="dimmed">
              {animaisFiltrados.length} registro(s) encontrado(s)
            </Text>
          </div>

          <TextInput
            aria-label="Pesquisar animais"
            placeholder="Pesquisar animal ou tutor..."
            leftSection={<Search size={17} />}
            value={busca}
            onChange={(event) => setBusca(event.currentTarget.value)}
            w={{ base: '100%', sm: 280 }}
          />
        </Group>

        {carregando ? (
          <Text c="dimmed" ta="center" py="xl">
            Carregando animais...
          </Text>
        ) : erroCarga ? (
          <Text c="dimmed" ta="center" py="xl">Lista indisponível. Atualize a página para tentar novamente.</Text>
        ) : animaisFiltrados.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            {busca
              ? 'Nenhum animal encontrado para essa pesquisa.'
              : 'Ainda não existem animais cadastrados.'}
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={700}>
            <Table verticalSpacing="md" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nome</Table.Th>
                  <Table.Th>Espécie</Table.Th>
                  <Table.Th>Raça</Table.Th>
                  <Table.Th>Tutor responsável</Table.Th>
                  <Table.Th ta="center">Ações</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {animaisFiltrados.map((animal) => (
                  <Table.Tr key={animal.id}>
                    <Table.Td>
                      <Text fw={600}>{animal.nome}</Text>
                    </Table.Td>

                    <Table.Td>
                      <Badge color="teal" variant="light">
                        {nomeEspecie(animal.especie)}
                      </Badge>
                    </Table.Td>

                    <Table.Td>
                      {animal.raca || 'Não informada'}
                    </Table.Td>

                    <Table.Td>
                      {animal.tutor.nome}
                    </Table.Td>

                    <Table.Td>
                      <Group justify="center" gap="xs">

                        <Tooltip label="Editar animal">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            aria-label="Editar animal"
                            onClick={() => abrirEdicao(animal)}
                          >
                            <Pencil size={17} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Excluir animal">
                          <ActionIcon
                            variant="light"
                            color="red"
                            aria-label="Excluir animal"
                            onClick={() => {
                              setAnimalParaExcluir(animal);
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
        title={animalSelecionado ? 'Editar animal' : 'Cadastrar animal'}
        centered
      >
        <form noValidate onSubmit={salvarAnimal}>
          <Stack gap="md">
            {mensagem && tipoMensagem === 'error' && <Alert color="red" role="alert">{mensagem}</Alert>}

            <TextInput
              label="Nome do animal"
              placeholder="Ex.: Mel"
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

            <Select
              label="Espécie"
              placeholder="Selecione a espécie"
              data={especies}
              value={formulario.especie}
              onChange={(value) =>
                setFormulario({
                  ...formulario,
                  especie: (value ?? 'CACHORRO') as Animal['especie'],
                })
              }
              error={errosCampos.especie}
              allowDeselect={false}
              required
            />

            <TextInput
              label="Raça"
              placeholder="Ex.: SRD, Labrador, Persa..."
              value={formulario.raca}
              onChange={(event) =>
                setFormulario({
                  ...formulario,
                  raca: event.currentTarget.value,
                })
              }
              error={errosCampos.raca}
            />

            <Select
              label="Tutor responsável"
              placeholder="Selecione o tutor"
              data={opcoesTutores}
              searchable
              nothingFoundMessage="Nenhum tutor encontrado"
              value={formulario.tutorId || null}
              onChange={(value) =>
                setFormulario({
                  ...formulario,
                  tutorId: value ?? '',
                })
              }
              error={errosCampos.tutorId}
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
                {animalSelecionado ? 'Salvar alterações' : 'Cadastrar'}
              </Button>
            </Group>

          </Stack>
        </form>
      </Modal>

      {/* Confirmação de exclusão */}
      <Modal
        opened={modalExcluir}
        onClose={() => { if (!excluindo) setModalExcluir(false); }}
        title="Excluir animal"
        centered
        size="sm"
      >
        <Stack gap="md">
          {mensagem && tipoMensagem === 'error' && <Alert color="red" role="alert">{mensagem}</Alert>}
          <Text size="sm">
            Deseja realmente excluir o animal{' '}
            <strong>{animalParaExcluir?.nome}</strong>?
          </Text>

          <Text size="xs" c="dimmed">
            Caso existam agendamentos vinculados a esse animal,
            o backend poderá impedir a exclusão.
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
              onClick={excluirAnimal}
            >
              Excluir
            </Button>
          </Group>
        </Stack>
      </Modal>

    </Stack>
  );
}
