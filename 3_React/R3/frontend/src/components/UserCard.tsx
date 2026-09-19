import { Edit3, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { ApiError } from '../services/api';
import type { User, UserFormValues } from '../types/user';
import { formatDateDDMMYY, fullName } from '../utils/formatters';
import { UserForm } from './UserForm';

interface UserCardProps {
  user: User;
  currentUser: User;
  onUpdate: (id: number, values: UserFormValues) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function UserCard({ user, currentUser, onUpdate, onDelete }: UserCardProps) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const canEdit = currentUser.role === 'admin' || currentUser.id === user.id;
  const canDelete = currentUser.role === 'admin' && currentUser.id !== user.id;

  async function submitUpdate(values: UserFormValues) {
    setError('');

    try {
      await onUpdate(user.id, values);
      setEditing(false);
    } catch (updateError) {
      setError(
        updateError instanceof ApiError
          ? updateError.message
          : 'No se pudo actualizar el usuario.',
      );
    }
  }

  async function submitDelete() {
    setError('');
    setDeleting(true);

    try {
      await onDelete(user.id);
    } catch (deleteError) {
      setError(
        deleteError instanceof ApiError ? deleteError.message : 'No se pudo eliminar el usuario.',
      );
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <article className="user-card">
      <div className="user-card-header">
        <div>
          <h3>{fullName(user.firstName, user.lastName)}</h3>
          <p>{user.email}</p>
        </div>
        <div className="badge-stack">
          <span className={`badge ${user.role === 'admin' ? 'text-bg-primary' : 'text-bg-secondary'}`}>
            {user.role === 'admin' ? 'Admin' : 'Usuario'}
          </span>
          <span className={`badge ${user.status === 'active' ? 'text-bg-success' : 'text-bg-warning'}`}>
            {user.status === 'active' ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {error ? <div className="alert alert-danger py-2">{error}</div> : null}

      {editing ? (
        <UserForm
          initialValues={user}
          submitLabel="Guardar cambios"
          canEditRole={currentUser.role === 'admin'}
          canEditStatus={currentUser.role === 'admin'}
          onCancel={() => setEditing(false)}
          onSubmit={submitUpdate}
        />
      ) : (
        <>
          <dl className="user-data-grid">
            <div>
              <dt>Documento</dt>
              <dd>
                {user.documentType} {user.documentNumber}
              </dd>
            </div>
            <div>
              <dt>Nacimiento</dt>
              <dd>
                {formatDateDDMMYY(user.birthDate)} · {user.age} años
              </dd>
            </div>
            <div>
              <dt>Telefono</dt>
              <dd>{user.phone || 'No informado'}</dd>
            </div>
            <div>
              <dt>Actualizado</dt>
              <dd>{formatDateDDMMYY(user.updatedAt.slice(0, 10))}</dd>
            </div>
          </dl>

          <div className="card-actions">
            {canEdit ? (
              <button
                type="button"
                className="btn btn-outline-primary btn-icon-text"
                onClick={() => setEditing(true)}
              >
                <Edit3 size={18} />
                <span>Editar</span>
              </button>
            ) : null}

            {canDelete && !confirmingDelete ? (
              <button
                type="button"
                className="btn btn-outline-danger btn-icon-text"
                onClick={() => setConfirmingDelete(true)}
              >
                <Trash2 size={18} />
                <span>Eliminar</span>
              </button>
            ) : null}
          </div>

          {confirmingDelete ? (
            <div className="delete-confirmation">
              <p>Esta accion elimina la cuenta y su perfil. No se puede deshacer.</p>
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-danger btn-icon-text"
                  onClick={submitDelete}
                  disabled={deleting}
                >
                  <Trash2 size={18} />
                  <span>{deleting ? 'Eliminando...' : 'Confirmar eliminacion'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-icon-text"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                >
                  <X size={18} />
                  <span>Cancelar</span>
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}

