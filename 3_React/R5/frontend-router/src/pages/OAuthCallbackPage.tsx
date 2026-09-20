import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { storeToken } from '../services/api';

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      storeToken(token);
      refreshSession()
        .then(() => navigate('/users', { replace: true }))
        .catch(() => navigate('/login?error=auth_failed', { replace: true }));
    } else {
      navigate('/login?error=no_token', { replace: true });
    }
  }, [searchParams, navigate, refreshSession]);

  return (
    <div className="text-center my-5 py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
      <p className="mt-3">Procesando autenticación social...</p>
    </div>
  );
}
