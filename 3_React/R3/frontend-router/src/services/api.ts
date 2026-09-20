import type { AuthResponse, User, UserFormValues } from '../types/user';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
const TOKEN_KEY = 'sistemaUsuarios.token';

interface ApiMessage {
  message?: string;
  details?: Record<string, string> | null;
}

export class ApiError extends Error {
  status: number;
  details: Record<string, string> | null;

  constructor(message: string, status: number, details: Record<string, string> | null = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Origen: componentes y contextos de React.
 * Destino: API Express. Centraliza token, errores y JSON.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getStoredToken();

  headers.set('Accept', 'application/json');

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      'No se pudo conectar con la API. Verificá que el backend esté iniciado en http://localhost:3001.',
      0,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => ({}))) as ApiMessage;

  if (!response.ok) {
    throw new ApiError(
      payload.message ?? 'No se pudo completar la operacion.',
      response.status,
      payload.details ?? null,
    );
  }

  return payload as T;
}

export const authApi = {
  register: (values: UserFormValues) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(values),
    }),
  login: (values: Pick<UserFormValues, 'email' | 'password'>) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(values),
    }),
  me: () => request<{ user: User }>('/auth/me'),
  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),
};

export const usersApi = {
  list: () => request<{ users: User[] }>('/users'),
  get: (id: number) => request<{ user: User }>(`/users/${id}`),
  create: (values: UserFormValues) =>
    request<{ user: User }>('/users', {
      method: 'POST',
      body: JSON.stringify(values),
    }),
  update: (id: number, values: UserFormValues) =>
    request<{ user: User }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(values),
    }),
  remove: (id: number) =>
    request<void>(`/users/${id}`, {
      method: 'DELETE',
    }),
};
