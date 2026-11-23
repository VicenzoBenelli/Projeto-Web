
import axios from 'axios';
import { clearSession, getSession } from '../auth/sessionStore';

// Chave usada para guardar o token da autenticação
export { TOKEN_KEY } from '../auth/session';

// Endereço da API
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adiciona o JWT automaticamente em cada requisição
api.interceptors.request.use((config) => {
  const token = getSession()?.token;

  if (token && !config.url?.startsWith('/auth/')) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

api.interceptors.response.use(response => response, (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401 &&
      !error.config?.url?.startsWith('/auth/')) {
    const current = getSession();
    // Uma resposta atrasada de uma sessão antiga não invalida um login novo.
    if (current && error.config?.headers.Authorization === `Bearer ${current.token}`) clearSession();
  }
  return Promise.reject(error);
});
