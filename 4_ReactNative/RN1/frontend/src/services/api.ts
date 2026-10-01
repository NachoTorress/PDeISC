import type { Answer, Purpose, Session, User } from '../types';

const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
export const apiBase = base || '';

export async function post<T>(path: string, body: object, token?: string): Promise<T> {
  if (!base) throw new Error('Configurá EXPO_PUBLIC_API_URL con la dirección de tu computadora.');
  let response: Response;
  try {
    response = await fetch(`${base}/auth${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body)
    });
  } catch {
    throw new Error('No se pudo conectar. Verificá que el servidor esté activo y el celular use la misma red.');
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudo completar la operación.');
  return data as T;
}

export const api = {
  login: (identifier: string, password: string) => post<Session>('/login', { identifier, password }),
  register: (email: string, displayName: string, password: string, answers: Answer[]) =>
    post<{ message: string }>('/register', { email, displayName, password, answers }),
  requestCode: (email: string, purpose: Purpose) => post<{ message: string }>('/request-code', { email, purpose }),
  verify: (email: string, code: string) => post<Session>('/verify-email', { email, code }),
  activate: (email: string, code: string, password: string, answers: Answer[]) =>
    post<Session>('/activate-local', { email, code, password, answers }),
  reset: (email: string, code: string, password: string, answers: Answer[]) =>
    post<{ message: string }>('/reset-password', { email, code, password, answers }),
  redeem: (ticket: string) => post<Session>('/oauth/redeem', { ticket }),
  me: (token: string) => post<{ user: User }>('/me', {}, token)
};
