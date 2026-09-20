import { Github, Route, ShieldCheck, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export function HomePage() {
  return (
    <section className="home-shell">
      <div className="section-heading">
        <span className="eyebrow">React Router + OAuth</span>
        <h1>Sistema de Usuarios R5</h1>
        <p>
          Frontend estructurado exclusivamente con React Router y autenticación con GitHub, Google y Discord.
        </p>
      </div>

      <div className="system-grid">
        <article className="system-card">
          <Route size={32} />
          <h2>Iniciar Sesión</h2>
          <p>Accedé a tu cuenta con tus credenciales o mediante proveedores sociales.</p>
          <NavLink className="btn btn-primary btn-icon-text" to="/login">
            <Route size={18} />
            <span>Ir al Login</span>
          </NavLink>
        </article>

        <article className="system-card">
          <Users size={32} />
          <h2>Registro de Usuarios</h2>
          <p>Crea una nueva cuenta local en el sistema de forma segura.</p>
          <NavLink className="btn btn-outline-primary btn-icon-text" to="/register">
            <Users size={18} />
            <span>Ir al Registro</span>
          </NavLink>
        </article>
      </div>

      <div className="feature-band">
        <div>
          <ShieldCheck size={26} />
          <strong>JWT + bcrypt</strong>
          <span>Sesión protegida y contraseñas seguras.</span>
        </div>
        <div>
          <Github size={26} />
          <strong>OAuth 2.0</strong>
          <span>Login con GitHub, Google y Discord.</span>
        </div>
        <div>
          <Route size={26} />
          <strong>React Router v6</strong>
          <span>Navegación limpia sin gestión por estado.</span>
        </div>
      </div>
    </section>
  );
}
