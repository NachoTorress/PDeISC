import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserForm } from '../../components/UserForm';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../services/api';
import type { UserFormValues } from '../../types/user';

export function RouterRegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  async function submit(values: UserFormValues) {
    setError('');

    try {
      await register(values);
      navigate('/users');
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : 'No se pudo registrar.');
    }
  }

  return (
    <div className="wide-page">
      <div className="auth-panel">
        <div className="section-heading">
          <span className="eyebrow">Alta de usuario</span>
          <h1>Registro con React Router</h1>
          <p>El primer usuario registrado queda como administrador automáticamente.</p>
        </div>
        {error ? <div className="alert alert-danger">{error}</div> : null}
        <UserForm submitLabel="Crear cuenta" includePassword onSubmit={submit} />
      </div>
      <p className="switch-copy">
        ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
      </p>
    </div>
  );
}
