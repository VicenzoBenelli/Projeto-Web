
import { Navigate, Outlet } from 'react-router-dom';
import { TOKEN_KEY } from '../services/api';

export default function ProtectedRoute() {
  const token = sessionStorage.getItem(TOKEN_KEY);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
