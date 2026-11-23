import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Alert, Anchor, Button, Paper, PasswordInput, Stack, TextInput, Title } from '@mantine/core';
import { cadastroSchema } from '../contracts';
import { api } from '../services/api';
import { errosApi, mensagemErro } from '../utils/apiError';
import { useAuth } from '../auth/AuthContext';

export default function Cadastro() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function cadastrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setErrors({});
    const result = cadastroSchema.safeParse({ nome, email, senha });
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map(issue => [issue.path.join('.'), issue.message])));
      return;
    }
    try {
      setLoading(true);
      await api.post('/auth/cadastro', result.data);
      navigate('/login', { replace: true, state: { cadastroConcluido: true } });
    } catch (cause) {
      setErrors(errosApi(cause));
      setError(mensagemErro(cause, 'Não foi possível cadastrar o usuário.'));
    } finally { setLoading(false); }
  }
  if (session) return <Navigate to="/home" replace />;
  return <Stack justify="center" align="center" mih="100vh" p="md" bg="gray.0">
    <Paper withBorder shadow="md" p="xl" w="100%" maw={420}>
      <Stack>
        <Title order={1} size="h2">Criar conta</Title>
        {error && <Alert color="red" role="alert">{error}</Alert>}
        <form onSubmit={cadastrar} noValidate>
          <Stack>
            <TextInput label="Nome" autoComplete="name" value={nome} onChange={e => setNome(e.currentTarget.value)} error={errors.nome} required />
            <TextInput label="E-mail" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.currentTarget.value)} error={errors.email} required />
            <PasswordInput label="Senha" autoComplete="new-password" value={senha} onChange={e => setSenha(e.currentTarget.value)} error={errors.senha} required />
            <Button type="submit" loading={loading}>Cadastrar conta</Button>
          </Stack>
        </form>
        <Anchor component={Link} to="/login">Já tenho conta — entrar</Anchor>
      </Stack>
    </Paper>
  </Stack>;
}
