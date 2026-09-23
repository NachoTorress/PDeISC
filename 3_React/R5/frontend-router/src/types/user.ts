export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'inactive';
export type DocumentType = 'DNI' | 'PAS' | 'LC';
export type AuthProviderType = 'local' | 'github' | 'google' | 'discord';

export interface User {
  id: number;
  email: string;
  provider?: AuthProviderType;
  providerId?: string | null;
  role: UserRole;
  status: UserStatus;
  firstName: string;
  lastName: string;
  birthDate?: string | null;
  age?: number | null;
  phone?: string | null;
  documentType?: DocumentType | null;
  documentNumber?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  birthDate: string;
  phone?: string;
  documentType: DocumentType | '';
  documentNumber: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiErrorDetails {
  [field: string]: string;
}
