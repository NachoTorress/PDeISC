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
export type AuthRequest = <T>(
  path: string,
  body: object,
  token?: string,
) => Promise<T>;
export class AuthError extends Error {
  constructor(
    message: string,
    public status = 0,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}
