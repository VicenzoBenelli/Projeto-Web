
import axios from 'axios';

export function mensagemErro(
  error: unknown,
  mensagemPadrao: string
): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {

    if (error.response?.status === 401) {
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
