import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';

import '@mantine/core/styles.css';
import './styles/global.css';

import App from './App';

// Configuração visual do sistema
const theme = createTheme({
  primaryColor: 'teal',
  defaultRadius: 'lg',
  fontFamily: 'Inter, system-ui, sans-serif',
});

ReactDOM.createRoot(
  document.getElementById('root')!
).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MantineProvider>
  </React.StrictMode>
);
