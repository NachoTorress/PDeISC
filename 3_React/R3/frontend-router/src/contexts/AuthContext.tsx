import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi, clearStoredToken, getStoredToken, storeToken } from '../services/api';
import type { AuthResponse, User, UserFormValues } from '../types/user';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (values: Pick<UserFormValues, 'email' | 'password'>) => Promise<void>;
  register: (values: UserFormValues) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateSessionUser: (user: User) => void;
}

const USER_KEY = 'sistemaUsuarios.user';
const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): User | null {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [loading, setLoading] = useState(true);

  const persistAuth = useCallback((response: AuthResponse) => {
    storeToken(response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    setUser(response.user);
  }, []);

  const clearAuth = useCallback(() => {
    clearStoredToken();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const token = getStoredToken();

    if (!token) {
      clearAuth();
      return;
    }

    const response = await authApi.me();
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    setUser(response.user);
  }, [clearAuth]);

  useEffect(() => {
    let ignore = false;

    async function loadSession() {
      try {
        if (getStoredToken()) {
          await refreshSession();
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      ignore = true;
    };
  }, [clearAuth, refreshSession]);

  const login = useCallback(
    async (values: Pick<UserFormValues, 'email' | 'password'>) => {
      const response = await authApi.login(values);
      persistAuth(response);
    },
    [persistAuth],
  );

  const register = useCallback(
    async (values: UserFormValues) => {
      const response = await authApi.register(values);
      persistAuth(response);
    },
    [persistAuth],
  );

  const logout = useCallback(async () => {
    try {
      if (getStoredToken()) {
        await authApi.logout();
      }
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const updateSessionUser = useCallback((updatedUser: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshSession,
      updateSessionUser,
    }),
    [loading, login, logout, refreshSession, register, updateSessionUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }

  return context;
}
