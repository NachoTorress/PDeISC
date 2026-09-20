import { LogIn, LogOut, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';

export type StateScreen = 'login' | 'register' | 'dashboard';

interface NavbarProps {
  currentScreen?: StateScreen;
  onNavigateScreen?: (screen: StateScreen) => void;
}

export function Navbar({ currentScreen, onNavigateScreen }: NavbarProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    if (onNavigateScreen) {
      onNavigateScreen('login');
    }
  }

  function handleNavigate(screen: StateScreen) {
    setMenuOpen(false);
    if (onNavigateScreen) {
      onNavigateScreen(screen);
    }
  }

  return (
    <nav className="navbar navbar-expand-lg app-navbar sticky-top">
      <div className="container">
        <button
          type="button"
          className="navbar-brand fw-bold btn btn-link p-0 text-decoration-none text-reset"
          onClick={() => handleNavigate(user ? 'dashboard' : 'login')}
        >
          Sistema Usuarios (useState)
        </button>
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="mainNavbar"
          aria-expanded={menuOpen}
          aria-label="Abrir menú"
          onClick={() => setMenuOpen((currentValue) => !currentValue)}
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="mainNavbar">
          <div className="navbar-nav me-auto">
            {!user ? (
              <>
                <button
                  type="button"
                  className={`nav-link nav-icon-link btn btn-link ${currentScreen === 'login' ? 'active fw-bold' : ''}`}
                  onClick={() => handleNavigate('login')}
                >
                  <LogIn size={17} />
                  Login
                </button>
                <button
                  type="button"
                  className={`nav-link nav-icon-link btn btn-link ${currentScreen === 'register' ? 'active fw-bold' : ''}`}
                  onClick={() => handleNavigate('register')}
                >
                  <UserPlus size={17} />
                  Registro
                </button>
              </>
            ) : (
              <button
                type="button"
                className={`nav-link nav-icon-link btn btn-link ${currentScreen === 'dashboard' ? 'active fw-bold' : ''}`}
                onClick={() => handleNavigate('dashboard')}
              >
                <Users size={17} />
                Panel Usuarios
              </button>
            )}
          </div>
          <div className="navbar-actions">
            <ThemeToggle />
            {user ? (
              <button type="button" className="btn btn-outline-danger btn-icon-text" onClick={handleLogout}>
                <LogOut size={18} />
                <span>Salir</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
