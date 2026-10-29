/**
 * Tipos compartidos de la autenticación: cuenta, sesión, almacenamiento seguro
 * y error de la API con su código HTTP y los mensajes por campo.
 */
export type AccountRole = "student" | "teacher" | "loans" | "admin" | "guest";
export interface AccountUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: AccountRole[];
  createdAt: string;
}
export interface Credentials {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  accountType?: "student" | "guest";
}
export interface AccountSession {
  user: AccountUser;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}
export interface SessionStorage {
  browser: boolean;
  read(): Promise<string | null>;
  write(token: string): Promise<void>;
  clear(): Promise<void>;
  lock<T>(action: () => Promise<T>): Promise<T>;
}
/**
 * Métodos HTTP que usa la API de ExpoTec. No se usa GET: las consultas van
 * por POST con sus datos en el cuerpo JSON.
 */
export type HttpMethod = "POST" | "PUT" | "PATCH" | "DELETE";
/** Función que envía una solicitud a la API; `body` siempre viaja como JSON. */
export type AuthRequest = <T>(
  path: string,
  body: object,
  token?: string,
  method?: HttpMethod,
) => Promise<T>;
/** Consulta o envío sin la sesión: misma firma que el cliente expone en `query` y `send`. */
export type ApiCall = <T>(
  path: string,
  body: object,
  method?: HttpMethod,
) => Promise<T>;
/** Error de la API: mensaje para mostrar, código HTTP y errores por campo del formulario. */
export class AuthError extends Error {
  constructor(
    message: string,
    public status = 0,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}
