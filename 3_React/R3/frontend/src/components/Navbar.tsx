import { Home, LogOut, Route, ToggleLeft } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    navigate('/');
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className="navbar navbar-expand-lg app-navbar sticky-top">
      <div className="container">
        <NavLink className="navbar-brand fw-bold" to="/" onClick={closeMenu}>
          Sistema Usuarios
        </NavLink>
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="mainNavbar"
          aria-expanded={menuOpen}
          aria-label="Abrir menu"
          onClick={() => setMenuOpen((currentValue) => !currentValue)}
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="mainNavbar">
          <div className="navbar-nav me-auto">
            <NavLink className="nav-link nav-icon-link" to="/" onClick={closeMenu}>
              <Home size={17} />
              Inicio
            </NavLink>
            <NavLink className="nav-link nav-icon-link" to="/router/login" onClick={closeMenu}>
              <Route size={17} />
              React Router
            </NavLink>
            <NavLink className="nav-link nav-icon-link" to="/state" onClick={closeMenu}>
              <ToggleLeft size={17} />
              useState
            </NavLink>
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
