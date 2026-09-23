import { Download, Filter, RefreshCcw, Search, ShieldAlert, UserPlus, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

  // Filtros y búsqueda avanzados (Power Admin)
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

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

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const nameMatch = fullName(u.firstName, u.lastName).toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch || emailMatch;

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesProvider = providerFilter === 'all' || (u.provider ?? 'local') === providerFilter;

      return matchesSearch && matchesRole && matchesProvider;
    });
  }, [users, searchTerm, roleFilter, providerFilter]);

  function exportCSV() {
    const headers = ['ID', 'Nombre', 'Apellido', 'Email', 'Proveedor', 'Rol', 'Estado', 'Creado'];
    const rows = filteredUsers.map((u) => [
      u.id,
      `"${u.firstName}"`,
      `"${u.lastName}"`,
      `"${u.email}"`,
      u.provider ?? 'local',
      u.role,
      u.status,
      u.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `usuarios_r5_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

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
        <span className="eyebrow">Panel de Administración Power</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <div className="current-user-strip">
        <div className="d-flex align-items-center gap-3">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.firstName}
              className="rounded-circle"
              width="40"
              height="40"
              style={{ objectFit: 'cover' }}
            />
          ) : null}
          <div>
            <span>Sesión activa</span>
            <strong>{fullName(user.firstName, user.lastName)}</strong>
          </div>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          {user.provider && user.provider !== 'local' ? (
            <span className="badge text-bg-info text-capitalize">OAuth: {user.provider}</span>
          ) : null}
          <span className="badge text-bg-primary">{user.role === 'admin' ? 'Administrador Power' : 'Usuario'}</span>
          <span className="badge text-bg-success">MySQL R5</span>
        </div>
      </div>

      {message ? <div className="alert alert-success">{message}</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      {/* Toolbar y Filtros Avanzados (Power Mode) */}
      <div className="card p-3 mb-4 shadow-sm">
        <div className="row g-3 align-items-center">
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3">
            <div className="input-group">
              <span className="input-group-text">
                <Filter size={16} />
              </span>
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'user')}
              >
                <option value="all">Todos los roles</option>
                <option value="admin">Administradores</option>
                <option value="user">Usuarios estándar</option>
              </select>
            </div>
          </div>

          <div className="col-md-3">
            <select
              className="form-select"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
            >
              <option value="all">Todos los proveedores</option>
              <option value="local">Registro Local</option>
              <option value="github">GitHub</option>
              <option value="google">Google</option>
              <option value="discord">Discord</option>
              <option value="twitter">X / Twitter</option>
              <option value="twitch">Twitch</option>
              <option value="facebook">Facebook</option>
              <option value="meta">Meta</option>
            </select>
          </div>

          <div className="col-md-2 text-end d-flex gap-2 justify-content-end">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
              onClick={exportCSV}
              title="Exportar listado a CSV"
            >
              <Download size={15} />
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="toolbar-row mb-3">
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
        <div className="create-user-panel mb-4">
          <div className="panel-heading-inline">
            <Users size={22} />
            <div>
              <h2>Nuevo usuario</h2>
              <p>El alta usa las mismas validaciones del registro público.</p>
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
        <div className="loading-panel">Cargando datos de la base R5...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="alert alert-info text-center py-4">
          <ShieldAlert className="mb-2" size={32} />
          <p className="mb-0">No se encontraron usuarios con los filtros aplicados.</p>
        </div>
      ) : (
        <div className="user-grid">
          {filteredUsers.map((listedUser) => (
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
