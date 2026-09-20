/**
 * Auth Context for Portfolio Admin Access.
 * Listens to window location hash (#admin or /admin) and enforces attempt rate limits (e.g., 3 attempts max per day).
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAdmin: boolean;
  login: (password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  remainingAttempts: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MAX_ATTEMPTS = 3;
const ATTEMPTS_KEY = 'admin_login_attempts';
const ATTEMPTS_DATE_KEY = 'admin_login_attempts_date';

const getRemainingAttempts = (): number => {
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem(ATTEMPTS_DATE_KEY);

  if (savedDate !== today) {
    localStorage.setItem(ATTEMPTS_DATE_KEY, today);
    localStorage.setItem(ATTEMPTS_KEY, '0');
    return MAX_ATTEMPTS;
  }

  const count = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10);
  return Math.max(0, MAX_ATTEMPTS - count);
};

const recordFailedAttempt = (): number => {
  const today = new Date().toDateString();
  localStorage.setItem(ATTEMPTS_DATE_KEY, today);
  const count = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10) + 1;
  localStorage.setItem(ATTEMPTS_KEY, count.toString());
  return Math.max(0, MAX_ATTEMPTS - count);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('portfolio_admin') === 'true';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number>(getRemainingAttempts);

  // Escuchar navegación /admin o #admin en la URL
  useEffect(() => {
    const checkHashOrPath = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin' || hash === '#admin') {
        setIsLoginModalOpen(true);
      }
    };

    checkHashOrPath();
    window.addEventListener('hashchange', checkHashOrPath);
    window.addEventListener('popstate', checkHashOrPath);

    return () => {
      window.removeEventListener('hashchange', checkHashOrPath);
      window.removeEventListener('popstate', checkHashOrPath);
    };
  }, []);

  const login = async (password: string) => {
    const currentAttempts = getRemainingAttempts();
    if (currentAttempts <= 0) {
      return {
        success: false,
        message: 'Has superado el límite de 3 intentos por día. Por seguridad el acceso ha sido bloqueado por hoy.',
      };
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password }),
      });
      const data = await response.json();

      if (data.success) {
        setIsAdmin(true);
        localStorage.setItem('portfolio_admin', 'true');
        setIsLoginModalOpen(false);
        // Limpiar hash de la URL al entrar
        if (window.location.hash === '#admin') {
          window.history.replaceState(null, '', window.location.pathname);
        }
        return { success: true };
      }

      const left = recordFailedAttempt();
      setRemainingAttempts(left);
      return {
        success: false,
        message:
          left > 0
            ? `Contraseña incorrecta. Te quedan ${left} de 3 intentos hoy.`
            : 'Has superado el límite de 3 intentos por día. Acceso bloqueado.',
      };
    } catch {
      const left = recordFailedAttempt();
      setRemainingAttempts(left);
      return {
        success: false,
        message:
          left > 0
            ? `Contraseña incorrecta. Te quedan ${left} de 3 intentos hoy.`
            : 'Has superado el límite de 3 intentos por día. Acceso bloqueado.',
      };
    }
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem('portfolio_admin');
  };

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        login,
        logout,
        isLoginModalOpen,
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => {
          setIsLoginModalOpen(false);
          if (window.location.hash === '#admin') {
            window.history.replaceState(null, '', window.location.pathname);
          }
        },
        remainingAttempts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
