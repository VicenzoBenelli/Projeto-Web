
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      // O frontend utilizará diretamente os arquivos TypeScript
      // do shared, evitando importar o JavaScript CommonJS.
      '@petshop/shared': fileURLToPath(
        new URL('../shared/src/index.ts', import.meta.url)
      ),
    },
  },

  server: {
    port: 5173,
  },
});
