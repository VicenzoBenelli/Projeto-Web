import React from 'react';
import ReactDOM from 'react-dom/client';
import '@mantine/core/styles.css';
import { MantineProvider, Container, Title, Text } from '@mantine/core';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider>
      <Container py="xl"><Title order={1}>Pet Shop</Title><Text>Estrutura inicial. A interface será implementada por Gabriel e Marcos.</Text></Container>
    </MantineProvider>
  </React.StrictMode>,
);
