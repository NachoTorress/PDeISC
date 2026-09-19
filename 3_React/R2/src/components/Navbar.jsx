/**
 * Navbar.jsx
 * -----------------------------------------------------------------------
 * De donde viene: se usa en `App.jsx`, visible en todas las páginas.
 * A donde va: enlaza (vía react-router) a HomePage y CreatePage, y
 *   controla el ThemeContext mediante `useTheme()`.
 * -----------------------------------------------------------------------
 * Barra de navegación superior, responsive con menú hamburguesa propio
 * de Bootstrap (navbar-toggler) y botón de tema claro/oscuro.
 */

import { NavLink } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";

function Navbar() {
  const { tema, alternarTema } = useTheme();

  return (
    <nav className="navbar navbar-expand-lg sticky-top app-navbar">
      <div className="container-fluid px-3 px-md-4">
        <NavLink className="navbar-brand fw-bold" to="/">
          📋 Lista de Tareas
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContenido"
          aria-controls="navbarContenido"
          aria-expanded="false"
          aria-label="Abrir menú de navegación"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContenido">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            <li className="nav-item">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  "nav-link" + (isActive ? " active" : "")
                }
              >
                Inicio
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/crear"
                className={({ isActive }) =>
                  "nav-link" + (isActive ? " active" : "")
                }
              >
                Nueva tarea
              </NavLink>
            </li>
            <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
              <button
                type="button"
                className="btn btn-outline-theme w-100"
                onClick={alternarTema}
                aria-label="Cambiar tema claro/oscuro"
              >
                {tema === "light" ? "🌙 Modo oscuro" : "☀️ Modo claro"}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
