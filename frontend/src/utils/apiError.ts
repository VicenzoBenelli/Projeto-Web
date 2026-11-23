
import axios from 'axios';

export function mensagemErro(
  error: unknown,
  mensagemPadrao: string
): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {

    if (error.response?.status === 401) {
      if (error.config?.url === '/auth/login') return 'E-mail ou senha inválidos.';
      return 'Sessão expirada ou usuário não autenticado. Entre novamente.';
    }

    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    if (!error.response) {
      return 'Não foi possível conectar à API. Verifique se o backend está funcionando.';
    }
  }

  return mensagemPadrao;
}

export function errosApi(error: unknown): Record<string, string> {
  if (!axios.isAxiosError<{ errors?: unknown }>(error)) return {};
  const errors = error.response?.data?.errors;
  if (!Array.isArray(errors)) return {};
  const result: Record<string, string> = {};
  for (const issue of errors) {
    if (typeof issue === 'object' && issue !== null && 'field' in issue &&
        typeof issue.field === 'string' && 'message' in issue && typeof issue.message === 'string') {
      result[issue.field] = issue.message;
    }
  }
  return result;
}
