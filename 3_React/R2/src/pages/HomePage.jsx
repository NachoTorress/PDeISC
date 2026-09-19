/**
 * HomePage.jsx
 * -----------------------------------------------------------------------
 * De donde viene: ruta "/" registrada en `App.jsx`.
 * A donde va: renderiza una `TaskCard.jsx` por tarea y enlaza (react
 *   router) hacia `/crear` para dar de alta una nueva tarea.
 * -----------------------------------------------------------------------
 * Página de inicio: lista de tareas + enlace para crear una nueva tarea.
 */

import { Link } from "react-router-dom";
import TaskCard from "../components/TaskCard";
import { useTasks } from "../hooks/useTasks";

function HomePage() {
  const { tareas, descargarTareas } = useTasks();

  const pendientes = tareas.filter((t) => !t.completada).length;

  return (
    <div className="container-fluid px-3 px-md-5 py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="page-title mb-1">Mis tareas</h1>
          <p className="text-muted mb-0">
            {tareas.length} tarea{tareas.length !== 1 ? "s" : ""} en total ·{" "}
            {pendientes} pendiente{pendientes !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="d-flex gap-2">
          {tareas.length > 0 && (
            <button
              type="button"
              className="btn btn-outline-theme"
              onClick={descargarTareas}
            >
              ⬇️ Descargar JSON
            </button>
          )}
          <Link to="/crear" className="btn btn-theme-primary">
            + Nueva tarea
          </Link>
        </div>
      </div>

      {tareas.length === 0 ? (
        <div className="empty-state">
          <p className="mb-3">Todavía no creaste ninguna tarea.</p>
          <Link to="/crear" className="btn btn-theme-primary">
            Crear la primera tarea
          </Link>
        </div>
      ) : (
        <div className="row g-3">
          {tareas.map((tarea) => (
            <div className="col-12 col-md-6 col-xl-4" key={tarea.id}>
              <TaskCard tarea={tarea} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HomePage;
