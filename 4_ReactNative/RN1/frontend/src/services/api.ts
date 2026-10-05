import type { Answer, Purpose, Session, User } from '../types';

// La API tiene su propio dominio; la web y Expo Go usan la misma URL pública.
const base = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
export const apiBase = base || '';

export async function post<T>(path: string, body: object, token?: string): Promise<T> {
  if (!base) throw new Error('Configurá EXPO_PUBLIC_API_URL con la URL HTTPS pública de la API.');
  let response: Response;
  try {
    response = await fetch(`${base}/auth${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body)
    });
  } catch {
    throw new Error('No se pudo conectar. Verificá que la API esté activa y que su URL sea accesible.');
  }
  const data = await response.json().catch(() => null) as (T & { error?: string }) | null;
  if (!response.ok) throw new Error(data?.error || 'El servidor no respondió correctamente. Intentá de nuevo.');
  if (!data) throw new Error('El servidor devolvió una respuesta inválida. Intentá de nuevo.');
  return data;
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
  oauthDeviceStart: (provider: 'google' | 'discord' | 'github') =>
    post<{ url: string; pollToken: string }>(`/oauth/${provider}/device-start`, {}),
  oauthDevicePoll: (pollToken: string) =>
    post<{ status: 'pending' } | { status: 'complete'; session: Session }>('/oauth/device-poll', { pollToken }),
  me: (token: string) => post<{ user: User }>('/me', {}, token)
};
