
import axios from 'axios';

// Chave usada para guardar o token da autenticação
export const TOKEN_KEY = 'petcare_token';

// Endereço da API
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adiciona o JWT automaticamente em cada requisição
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
