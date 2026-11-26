
import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { lazy, Suspense } from 'react';
import { Center, Loader } from '@mantine/core';


import ProtectedRoute from './routes/ProtectedRoute';

import Login from './pages/Login';
const AppLayout = lazy(() => import('./components/AppLayout'));
const Cadastro = lazy(() => import('./pages/Cadastro'));
const Home = lazy(() => import('./pages/Home'));
const Tutores = lazy(() => import('./pages/Tutores'));
const Animais = lazy(() => import('./pages/Animais'));
const Servicos = lazy(() => import('./pages/Servicos'));
const Agendamentos = lazy(() => import('./pages/Agendamentos'));

export default function App() {
  return (
    <Suspense fallback={<Center p="xl"><Loader aria-label="Carregando página" /></Center>}>
      <Routes>

        {/* Página pública */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* Páginas que exigem autenticação */}
        <Route element={<ProtectedRoute />}>

          <Route path="/" element={<AppLayout />}>

            <Route
              index
              element={<Navigate to="/home" replace />}
            />

            <Route path="home" element={<Home />} />

            <Route path="tutores" element={<Tutores />} />

            <Route path="animais" element={<Animais />} />

            <Route path="servicos" element={<Servicos />} />

            <Route path="agendamentos" element={<Agendamentos />} />

          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Suspense>
  );
}
