import { Route, ShieldCheck, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export function HomePage() {
  return (
    <section className="home-shell">
      <div className="section-heading">
        <span className="eyebrow">React Router Frontend</span>
        <h1>Sistema de Usuarios (React Router)</h1>
        <p>
          Frontend independiente estructurado con rutas declarativas utilizando React Router.
        </p>
      </div>

      <div className="system-grid">
        <article className="system-card">
          <Route size={32} />
          <h2>Iniciar Sesión</h2>
          <p>Accedé a tu cuenta con tus credenciales guardadas.</p>
          <NavLink className="btn btn-primary btn-icon-text" to="/login">
            <Route size={18} />
            <span>Ir al Login</span>
          </NavLink>
        </article>

        <article className="system-card">
          <Users size={32} />
          <h2>Registro de Usuarios</h2>
          <p>Crea una nueva cuenta en el sistema de forma segura.</p>
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
          <Route size={26} />
          <strong>React Router v6</strong>
          <span>Rutas públicas y protegidas integradas.</span>
        </div>
      </div>
    </section>
  );
}
