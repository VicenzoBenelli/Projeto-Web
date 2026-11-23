
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Alert,
  Button,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
  ThemeIcon,
} from '@mantine/core';

import { PawPrint, LogIn } from 'lucide-react';

import { loginSchema } from '../contracts';
import { api, TOKEN_KEY } from '../services/api';
import { mensagemErro } from '../utils/apiError';

type LoginResponse = {
  token: string;
  usuario: {
    id: number;
    nome: string;
    email: string;
  };
};

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(false);

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro('');
    setErrosCampos({});

    const validacao = loginSchema.safeParse({
      email,
      senha,
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
      setCarregando(true);

      const resposta = await api.post<LoginResponse>(
        '/auth/login',
        validacao.data
      );

      sessionStorage.setItem(TOKEN_KEY, resposta.data.token);

      sessionStorage.setItem(
        'petcare_usuario',
        JSON.stringify(resposta.data.usuario)
      );

      navigate('/home', { replace: true });

    } catch (error) {
      setErro(mensagemErro(error, 'Não foi possível realizar o login.'));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Stack
      justify="center"
      align="center"
      mih="100vh"
      p="md"
      bg="gray.0"
    >
      <Paper
        withBorder
        shadow="md"
        radius="lg"
        p="xl"
        w="100%"
        maw={420}
      >
        <Stack gap="lg">

          <Stack align="center" gap="xs">
            <ThemeIcon size={58} radius="xl" color="teal">
              <PawPrint size={30} />
            </ThemeIcon>

            <Title order={2}>PetCare</Title>

            <Text size="sm" c="dimmed">
              Entre para acessar o sistema
            </Text>
          </Stack>

          {erro && (
            <Alert color="red" title="Não foi possível entrar">
              {erro}
            </Alert>
          )}

          <form onSubmit={entrar}>
            <Stack gap="md">

              <TextInput
                label="E-mail"
                placeholder="seuemail@email.com"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                error={errosCampos.email}
                required
              />

              <PasswordInput
                label="Senha"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(event) => setSenha(event.currentTarget.value)}
                error={errosCampos.senha}
                required
              />

              <Button
                type="submit"
                color="teal"
                leftSection={<LogIn size={18} />}
                loading={carregando}
                fullWidth
              >
                Entrar
              </Button>

            </Stack>
          </form>

          <Text size="xs" c="dimmed" ta="center">
            Sistema de gerenciamento PetCare
          </Text>

        </Stack>
      </Paper>
    </Stack>
  );
}
