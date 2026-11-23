
import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import AppLayout from './components/AppLayout';
import ProtectedRoute from './routes/ProtectedRoute';

import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Home from './pages/Home';
import Tutores from './pages/Tutores';
import Animais from './pages/Animais';
import ModuloEmConstrucao from './pages/ModuloEmConstrucao';

export default function App() {
  return (
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

          <Route
            path="servicos"
            element={
              <ModuloEmConstrucao
                titulo="Serviços"
                descricao="Cadastro e gerenciamento dos serviços."
              />
            }
          />

          <Route
            path="agendamentos"
            element={
              <ModuloEmConstrucao
                titulo="Agendamentos"
                descricao="Gerenciamento dos horários de atendimento."
              />
            }
          />

        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}
