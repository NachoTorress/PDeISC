/**
 * DetailPage.jsx
 * -----------------------------------------------------------------------
 * De donde viene: ruta "/tarea/:id" registrada en `App.jsx`, navegada
 *   desde `TaskCard.jsx` en `HomePage.jsx`.
 * A donde va: usa `useTasks()` para leer/editar/eliminar la tarea, y
 *   `TaskForm.jsx` para el modo edición.
 * -----------------------------------------------------------------------
 * Página de detalle: título, descripción completa, fecha de creación y
 * estado (completa/incompleta) de una tarea puntual. Permite editar o
 * eliminar (con confirmación estilizada) desde acá — CRUD completo.
 */

import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import TaskForm from "../components/TaskForm";
import ConfirmDelete from "../components/ConfirmDelete";
import { formatearFecha } from "../utils/validators";
import { useTasks } from "../hooks/useTasks";

function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tareas, actualizarTarea, eliminarTarea, alternarEstado } = useTasks();

  const [editando, setEditando] = useState(false);
  const [pidiendoConfirmacion, setPidiendoConfirmacion] = useState(false);

  const tarea = tareas.find((t) => String(t.id) === id);

  if (!tarea) {
    return (
      <div className="container-fluid px-3 px-md-5 py-4">
        <div className="empty-state">
          <p className="mb-3">Esa tarea no existe o ya fue eliminada.</p>
          <Link to="/" className="btn btn-theme-primary">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const manejarGuardar = (datos) => {
    actualizarTarea(tarea.id, datos);
    setEditando(false);
  };

  const manejarEliminar = () => {
    eliminarTarea(tarea.id);
    navigate("/");
  };

  return (
    <div className="container-fluid px-3 px-md-5 py-4">
      <Link to="/" className="back-link mb-3 d-inline-block">
        ← Volver al inicio
      </Link>

      <div className="detail-card">
        {pidiendoConfirmacion ? (
          <ConfirmDelete
            onConfirmar={manejarEliminar}
            onCancelar={() => setPidiendoConfirmacion(false)}
          />
        ) : editando ? (
          <>
            <h2 className="mb-3">Editar tarea</h2>
            <TaskForm
              valoresIniciales={tarea}
              textoBoton="Guardar cambios"
              onGuardar={manejarGuardar}
              onCancelar={() => setEditando(false)}
            />
          </>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
              <h2 className="mb-2">{tarea.titulo}</h2>
              <span
                className={
                  "badge rounded-pill fs-6 " +
                  (tarea.completada ? "badge-done" : "badge-pending")
                }
              >
                {tarea.completada ? "Completa" : "Incompleta"}
              </span>
            </div>

            <p className="detail-card__descripcion">{tarea.descripcion}</p>

            <p className="text-muted mb-4">
              Creada el <strong>{formatearFecha(tarea.fechaCreacion)}</strong>
            </p>

            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-outline-theme"
                onClick={() => alternarEstado(tarea.id)}
              >
                {tarea.completada ? "Marcar incompleta" : "Marcar completa"}
              </button>
              <button
                type="button"
                className="btn btn-theme-primary"
                onClick={() => setEditando(true)}
              >
                ✏️ Editar
              </button>
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => setPidiendoConfirmacion(true)}
              >
                🗑️ Eliminar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DetailPage;
