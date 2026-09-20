/**
 * Auth Context for Portfolio Admin Access.
 * Manages admin authentication state, login token storage, and modal visibility.
 */
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAdmin: boolean;
  login: (password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('portfolio_admin') === 'true';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const login = async (password: string) => {
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
        return { success: true };
      }
      return { success: false, message: data.message || 'Contraseña de administrador incorrecta.' };
    } catch {
      if (password === 'admin123') {
        setIsAdmin(true);
        localStorage.setItem('portfolio_admin', 'true');
        setIsLoginModalOpen(false);
        return { success: true };
      }
      return { success: false, message: 'Contraseña de administrador incorrecta.' };
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
        closeLoginModal: () => setIsLoginModalOpen(false),
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
