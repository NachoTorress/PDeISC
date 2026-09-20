import { RefreshCcw, UserPlus, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ApiError, usersApi } from '../services/api';
import type { User, UserFormValues } from '../types/user';
import { fullName } from '../utils/formatters';
import { UserCard } from './UserCard';
import { UserForm } from './UserForm';

interface UserDashboardProps {
  title: string;
  description: string;
}

export function UserDashboard({ title, description }: UserDashboardProps) {
  const { user, updateSessionUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await usersApi.list();
      setUsers(response.users);
    } catch (loadError) {
      setError(loadError instanceof ApiError ? loadError.message : 'No se pudieron cargar usuarios.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function createNewUser(values: UserFormValues) {
    setMessage('');
    setError('');

    try {
      const response = await usersApi.create(values);
      setUsers((currentUsers) => [response.user, ...currentUsers]);
      setShowCreateForm(false);
      setMessage('Usuario creado correctamente.');
    } catch (createError) {
      setError(createError instanceof ApiError ? createError.message : 'No se pudo crear el usuario.');
    }
  }

  async function updateExistingUser(id: number, values: UserFormValues) {
    const response = await usersApi.update(id, values);
    setUsers((currentUsers) =>
      currentUsers.map((currentUser) => (currentUser.id === id ? response.user : currentUser)),
    );

    if (user?.id === id) {
      updateSessionUser(response.user);
    }

    setMessage('Cambios guardados correctamente.');
  }

  async function deleteExistingUser(id: number) {
    await usersApi.remove(id);
    setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.id !== id));
    setMessage('Usuario eliminado correctamente.');
  }

  if (!user) {
    return null;
  }

  return (
    <section className="dashboard-shell">
      <div className="section-heading">
        <span className="eyebrow">Panel protegido</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <div className="current-user-strip">
        <div>
          <span>Sesion activa</span>
          <strong>{fullName(user.firstName, user.lastName)}</strong>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <span className="badge text-bg-primary">{user.role === 'admin' ? 'Administrador' : 'Usuario'}</span>
          <span className="badge text-bg-success">Datos persistidos</span>
        </div>
      </div>

      {message ? <div className="alert alert-success">{message}</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="toolbar-row">
        <button type="button" className="btn btn-outline-primary btn-icon-text" onClick={loadUsers}>
          <RefreshCcw size={18} />
          <span>Actualizar</span>
        </button>

        {user.role === 'admin' && !showCreateForm ? (
          <button
            type="button"
            className="btn btn-primary btn-icon-text"
            onClick={() => setShowCreateForm(true)}
          >
            <UserPlus size={18} />
            <span>Crear usuario</span>
          </button>
        ) : null}
      </div>

      {user.role === 'admin' && showCreateForm ? (
        <div className="create-user-panel">
          <div className="panel-heading-inline">
            <Users size={22} />
            <div>
              <h2>Nuevo usuario</h2>
              <p>El alta usa las mismas validaciones del registro publico.</p>
            </div>
          </div>
          <UserForm
            submitLabel="Crear usuario"
            includePassword
            canEditRole
            canEditStatus
            onCancel={() => setShowCreateForm(false)}
            onSubmit={createNewUser}
          />
        </div>
      ) : null}

      {loading ? (
        <div className="loading-panel">Cargando datos...</div>
      ) : (
        <div className="user-grid">
          {users.map((listedUser) => (
            <UserCard
              key={listedUser.id}
              user={listedUser}
              currentUser={user}
              onUpdate={updateExistingUser}
              onDelete={deleteExistingUser}
            />
          ))}
        </div>
      )}
    </section>
  );
}

