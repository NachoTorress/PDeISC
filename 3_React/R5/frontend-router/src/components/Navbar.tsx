import { Home, LogIn, LogOut, UserPlus, Users } from 'lucide-react';
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
    navigate('/login');
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className="navbar navbar-expand-lg app-navbar sticky-top">
      <div className="container">
        <NavLink className="navbar-brand fw-bold" to="/" onClick={closeMenu}>
          Sistema Usuarios (R5 OAuth)
        </NavLink>
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
            <NavLink className="nav-link nav-icon-link" to="/" onClick={closeMenu}>
              <Home size={17} />
              Inicio
            </NavLink>

            {!user ? (
              <>
                <NavLink className="nav-link nav-icon-link" to="/login" onClick={closeMenu}>
                  <LogIn size={17} />
                  Login
                </NavLink>
                <NavLink className="nav-link nav-icon-link" to="/register" onClick={closeMenu}>
                  <UserPlus size={17} />
                  Registro
                </NavLink>
              </>
            ) : (
              <NavLink className="nav-link nav-icon-link" to="/users" onClick={closeMenu}>
                <Users size={17} />
                Panel Usuarios
              </NavLink>
            )}
          </div>
          <div className="navbar-actions d-flex align-items-center gap-3">
            {user ? (
              <div className="d-flex align-items-center gap-2 me-2">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.firstName}
                    className="rounded-circle"
                    width="32"
                    height="32"
                    style={{ objectFit: 'cover' }}
                  />
                ) : null}
                <span className="small text-muted">{user.firstName}</span>
              </div>
            ) : null}
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
