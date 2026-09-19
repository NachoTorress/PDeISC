import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading-panel">Verificando sesion...</div>;
  }

  if (!user) {
    return <Navigate to="/router/login" replace state={{ from: location }} />;
  }

  return children;
}

