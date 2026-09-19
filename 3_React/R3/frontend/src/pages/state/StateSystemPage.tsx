import { Route, ToggleLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LoginForm } from '../../components/LoginForm';
import { UserDashboard } from '../../components/UserDashboard';
import { UserForm } from '../../components/UserForm';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../services/api';
import type { UserFormValues } from '../../types/user';

type StateScreen = 'login' | 'register' | 'dashboard';

export function StateSystemPage() {
  const { user, register } = useAuth();
  const [screen, setScreen] = useState<StateScreen>(user ? 'dashboard' : 'login');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setScreen('dashboard');
    } else if (screen === 'dashboard') {
      setScreen('login');
    }
  }, [screen, user]);

  async function submitRegister(values: UserFormValues) {
    setError('');

    try {
      await register(values);
      setScreen('dashboard');
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : 'No se pudo registrar.');
    }
  }

  return (
    <section className="state-shell">
      <div className="state-switcher" role="tablist" aria-label="Navegacion del sistema useState">
        <button
          type="button"
          className={`btn btn-icon-text ${screen === 'login' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setScreen('login')}
          disabled={Boolean(user)}
        >
          <Route size={18} />
          <span>Login</span>
        </button>
        <button
          type="button"
          className={`btn btn-icon-text ${screen === 'register' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setScreen('register')}
          disabled={Boolean(user)}
        >
          <ToggleLeft size={18} />
          <span>Registro</span>
        </button>
        <button
          type="button"
          className={`btn btn-icon-text ${screen === 'dashboard' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setScreen('dashboard')}
          disabled={!user}
        >
          <ToggleLeft size={18} />
          <span>Panel</span>
        </button>
      </div>

      {screen === 'login' ? (
        <div className="narrow-page">
          <LoginForm onSuccess={() => setScreen('dashboard')} />
          <p className="switch-copy">
            No tenes cuenta?{' '}
            <button type="button" className="link-button" onClick={() => setScreen('register')}>
              Registrate
            </button>
          </p>
        </div>
      ) : null}

      {screen === 'register' ? (
        <div className="wide-page">
          <div className="auth-panel">
            <div className="section-heading">
              <span className="eyebrow">Alta de usuario</span>
              <h1>Registro con useState</h1>
              <p>El cambio de pantalla se maneja con estado local, sin rutas internas.</p>
            </div>
            {error ? <div className="alert alert-danger">{error}</div> : null}
            <UserForm submitLabel="Crear cuenta" includePassword onSubmit={submitRegister} />
          </div>
        </div>
      ) : null}

      {screen === 'dashboard' ? (
        <UserDashboard
          title="Sistema con useState"
          description="Esta version conserva las pantallas equivalentes cambiando el estado local del componente."
        />
      ) : null}
    </section>
  );
}

