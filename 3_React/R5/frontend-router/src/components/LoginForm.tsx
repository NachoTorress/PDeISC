import { Github, LogIn, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../services/api';
import type { UserFormValues } from '../types/user';
import { FormField } from './FormField';

interface LoginFormProps {
  onSuccess: () => void;
}

type LoginValues = Pick<UserFormValues, 'email' | 'password'>;

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth();
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LoginValues>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function submit(values: LoginValues) {
    setFormError('');

    try {
      await login(values);
      onSuccess();
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'No se pudo iniciar sesion.');
    }
  }

  function handleSocialLogin(provider: 'github' | 'google' | 'discord') {
    window.location.href = `${API_BASE_URL}/auth/${provider}`;
  }

  return (
    <div className="auth-panel">
      <form onSubmit={handleSubmit(submit)} noValidate>
        <div className="section-heading">
          <span className="eyebrow">Ingreso seguro</span>
          <h1>Iniciar sesión</h1>
          <p>Accedé con tu email y contraseña o a través de tus redes sociales.</p>
        </div>

        {formError ? <div className="alert alert-danger">{formError}</div> : null}

        <FormField
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', {
            required: 'El email es obligatorio.',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Ingresá un email válido.',
            },
          })}
        />

        <FormField
          id="login-password"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password', {
            required: 'La contraseña es obligatoria.',
          })}
        />

        <button
          type="submit"
          className="btn btn-primary btn-icon-text w-100 mb-3"
          disabled={isSubmitting || !isValid}
        >
          <LogIn size={18} />
          <span>{isSubmitting ? 'Ingresando...' : 'Ingresar'}</span>
        </button>
      </form>

      <div className="text-center my-3 text-muted">
        <small>O ingresá con tu cuenta social</small>
      </div>

      <div className="d-flex flex-column gap-2">
        <button
          type="button"
          className="btn btn-outline-dark btn-icon-text w-100 d-flex align-items-center justify-content-center"
          onClick={() => handleSocialLogin('github')}
        >
          <Github size={18} className="me-2" />
          <span>Continuar con GitHub</span>
        </button>

        <button
          type="button"
          className="btn btn-outline-danger btn-icon-text w-100 d-flex align-items-center justify-content-center"
          onClick={() => handleSocialLogin('google')}
        >
          <svg className="me-2" width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M21.35 11.1H12v3.8h5.36c-.23 1.25-1.04 2.31-2.22 3.01v2.5h3.6c2.1-1.94 3.31-4.8 3.31-8.31 0-.58-.05-1.14-.15-1.68z"
            />
            <path
              fill="currentColor"
              d="M12 21c2.97 0 5.46-.98 7.28-2.66l-3.6-2.5c-.98.66-2.23 1.06-3.68 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.58C4 18.47 7.73 21 12 21z"
            />
            <path
              fill="currentColor"
              d="M5.84 12.37c-.22-.66-.35-1.36-.35-2.07s.13-1.41.35-2.07V5.65H2.18C1.43 7.15 1 8.83 1 10.6s.43 3.45 1.18 4.95l3.66-2.58z"
            />
            <path
              fill="currentColor"
              d="M12 4.16c1.62 0 3.08.56 4.23 1.65l3.18-3.18C17.45 1.02 14.96 0 12 0 7.73 0 4 2.53 2.18 6.05l3.66 2.58c.87-2.6 3.3-4.47 6.16-4.47z"
            />
          </svg>
          <span>Continuar con Google</span>
        </button>

        <button
          type="button"
          className="btn btn-outline-primary btn-icon-text w-100 d-flex align-items-center justify-content-center"
          onClick={() => handleSocialLogin('discord')}
        >
          <MessageSquare size={18} className="me-2" />
          <span>Continuar con Discord</span>
        </button>
      </div>
    </div>
  );
}
