import { LogIn } from 'lucide-react';
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

  return (
    <form className="auth-panel" onSubmit={handleSubmit(submit)} noValidate>
      <div className="section-heading">
        <span className="eyebrow">Ingreso seguro</span>
        <h1>Iniciar sesion</h1>
        <p>Accede con tu email y contrasena para gestionar los datos permitidos.</p>
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
        className="btn btn-primary btn-icon-text w-100"
        disabled={isSubmitting || !isValid}
      >
        <LogIn size={18} />
        <span>{isSubmitting ? 'Ingresando...' : 'Ingresar'}</span>
      </button>
    </form>
  );
}

