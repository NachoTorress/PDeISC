import { Database, Route, ShieldCheck, ToggleLeft } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export function HomePage() {
  return (
    <section className="home-shell">
      <div className="section-heading">
        <span className="eyebrow">Trabajo practico completo</span>
        <h1>Sistema de usuarios conectado a SQL</h1>
        <p>
          Elegi una de las dos versiones. Ambas usan la misma API, las mismas validaciones,
          persistencia local y proteccion de datos.
        </p>
      </div>

      <div className="system-grid">
        <article className="system-card">
          <Route size={32} />
          <h2>Version React Router</h2>
          <p>Login, registro y panel separados por rutas protegidas.</p>
          <NavLink className="btn btn-primary btn-icon-text" to="/router/login">
            <Route size={18} />
            <span>Abrir version con rutas</span>
          </NavLink>
        </article>

        <article className="system-card">
          <ToggleLeft size={32} />
          <h2>Version useState</h2>
          <p>La navegacion interna cambia con estado local dentro de una misma pagina.</p>
          <NavLink className="btn btn-outline-primary btn-icon-text" to="/state">
            <ToggleLeft size={18} />
            <span>Abrir version con estado</span>
          </NavLink>
        </article>
      </div>

      <div className="feature-band">
        <div>
          <ShieldCheck size={26} />
          <strong>JWT + bcrypt</strong>
          <span>Sesion protegida y passwords sin texto plano.</span>
        </div>
        <div>
          <Database size={26} />
          <strong>SQL en 3FN</strong>
          <span>Cuentas, perfiles, roles y documentos separados.</span>
        </div>
      </div>
    </section>
  );
}

