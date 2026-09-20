import { Save, X } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import type { User, UserFormValues } from '../types/user';
import { calculateAge } from '../utils/formatters';
import { FormField } from './FormField';

interface UserFormProps {
  initialValues?: Partial<User>;
  submitLabel: string;
  includePassword?: boolean;
  canEditRole?: boolean;
  canEditStatus?: boolean;
  onCancel?: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
}

const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' ]{2,50}$/u;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const today = new Date().toISOString().slice(0, 10);

function buildDefaultValues(initialValues?: Partial<User>): UserFormValues {
  return {
    firstName: initialValues?.firstName ?? '',
    lastName: initialValues?.lastName ?? '',
    email: initialValues?.email ?? '',
    password: '',
    birthDate: initialValues?.birthDate ?? '',
    phone: initialValues?.phone ?? '',
    documentType: initialValues?.documentType ?? 'DNI',
    documentNumber: initialValues?.documentNumber ?? '',
    role: initialValues?.role ?? 'user',
    status: initialValues?.status ?? 'active',
  };
}

export function UserForm({
  initialValues,
  submitLabel,
  includePassword = false,
  canEditRole = false,
  canEditStatus = false,
  onCancel,
  onSubmit,
}: UserFormProps) {
  const defaultValues = useMemo(() => buildDefaultValues(initialValues), [initialValues]);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<UserFormValues>({
    mode: 'onChange',
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const watchedBirthDate = watch('birthDate');
  const calculatedAge = calculateAge(watchedBirthDate);

  async function submit(values: UserFormValues) {
    const cleanValues = {
      ...values,
      phone: values.phone?.trim() || undefined,
      password: values.password?.trim() || undefined,
    };

    await onSubmit(cleanValues);
  }

  return (
    <form className="user-form" onSubmit={handleSubmit(submit)} noValidate>
      <div className="row g-3">
        <div className="col-md-6">
          <FormField
            id="firstName"
            label="Nombre"
            type="text"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register('firstName', {
              required: 'El nombre es obligatorio.',
              pattern: {
                value: NAME_REGEX,
                message: 'Solo letras, espacios y apostrofes.',
              },
            })}
          />
        </div>

        <div className="col-md-6">
          <FormField
            id="lastName"
            label="Apellido"
            type="text"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register('lastName', {
              required: 'El apellido es obligatorio.',
              pattern: {
                value: NAME_REGEX,
                message: 'Solo letras, espacios y apostrofes.',
              },
            })}
          />
        </div>

        <div className="col-md-6">
          <FormField
            id="email"
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
        </div>

        {includePassword ? (
          <div className="col-md-6">
            <FormField
              id="password"
              label="Contraseña"
              type="password"
              autoComplete="new-password"
              helpText="Debe tener mayúscula, minúscula, número y símbolo."
              error={errors.password?.message}
              {...register('password', {
                required: 'La contraseña es obligatoria.',
                pattern: {
                  value: PASSWORD_REGEX,
                  message: 'Usá al menos 8 caracteres con mayúscula, minúscula, número y símbolo.',
                },
              })}
            />
          </div>
        ) : null}

        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="documentType">
            Tipo de documento
          </label>
          <select
            id="documentType"
            className={`form-select ${errors.documentType ? 'is-invalid' : ''}`}
            {...register('documentType', {
              validate: (value) =>
                ['DNI', 'PAS', 'LC'].includes(value) || 'Seleccioná un tipo válido.',
            })}
          >
            <option value="DNI">DNI</option>
            <option value="PAS">Pasaporte</option>
            <option value="LC">Libreta Cívica</option>
          </select>
          {errors.documentType ? (
            <div className="invalid-feedback">{errors.documentType.message}</div>
          ) : null}
        </div>

        <div className="col-md-6">
          <FormField
            id="documentNumber"
            label="Numero de documento"
            type="text"
            inputMode="numeric"
            error={errors.documentNumber?.message}
            {...register('documentNumber', {
              required: 'El documento es obligatorio.',
              pattern: {
                value: /^\d{6,12}$/,
                message: 'Debe tener entre 6 y 12 números positivos.',
              },
            })}
          />
        </div>

        <div className="col-md-6">
          <FormField
            id="birthDate"
            label="Fecha de nacimiento"
            type="date"
            max={today}
            error={errors.birthDate?.message}
            helpText={
              calculatedAge === null ? undefined : `Edad calculada automaticamente: ${calculatedAge}`
            }
            {...register('birthDate', {
              required: 'La fecha de nacimiento es obligatoria.',
              validate: (value) => {
                const age = calculateAge(value);

                if (age === null) {
                  return 'Ingresá una fecha válida.';
                }

                if (age < 0) {
                  return 'La fecha no puede ser futura.';
                }

                if (age > 120) {
                  return 'La edad no puede superar 120 años.';
                }

                return true;
              },
            })}
          />
        </div>

        <div className="col-md-6">
          <FormField
            id="phone"
            label="Telefono"
            type="tel"
            autoComplete="tel"
            error={errors.phone?.message}
            {...register('phone', {
              pattern: {
                value: /^\+?\d{7,15}$/,
                message: 'Solo números y + al inicio.',
              },
            })}
          />
        </div>

        {canEditRole ? (
          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="role">
              Rol
            </label>
            <select id="role" className="form-select" {...register('role')}>
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        ) : null}

        {canEditStatus ? (
          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="status">
              Estado
            </label>
            <select id="status" className="form-select" {...register('status')}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        ) : null}
      </div>

      <div className="form-actions">
        {onCancel ? (
          <button type="button" className="btn btn-outline-secondary btn-icon-text" onClick={onCancel}>
            <X size={18} />
            <span>Cancelar</span>
          </button>
        ) : null}
        <button
          type="submit"
          className="btn btn-primary btn-icon-text"
          disabled={isSubmitting || !isValid}
        >
          <Save size={18} />
          <span>{isSubmitting ? 'Guardando...' : submitLabel}</span>
        </button>
      </div>
    </form>
  );
}

