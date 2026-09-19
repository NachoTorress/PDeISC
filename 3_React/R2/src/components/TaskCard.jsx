/**
 * TaskCard.jsx
 * -----------------------------------------------------------------------
 * De donde viene: renderizado desde `HomePage.jsx`, una vez por cada
 *   tarea en la lista del `TasksContext`.
 * A donde va: enlaza (react-router) hacia `DetailPage`, y usa
 *   `ConfirmDelete.jsx` + `useTasks()` para el borrado.
 * -----------------------------------------------------------------------
 * Tarjeta resumen de una tarea para la página de inicio: título,
 * descripción corta, fecha de creación y estado. Incluye acciones
 * rápidas de completar/eliminar.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDelete from "./ConfirmDelete";
import { formatearFecha } from "../utils/validators";
import { useTasks } from "../hooks/useTasks";

const LARGO_MAX_RESUMEN = 90;

function TaskCard({ tarea }) {
  const { eliminarTarea, alternarEstado } = useTasks();
  const [pidiendoConfirmacion, setPidiendoConfirmacion] = useState(false);

  const descripcionCorta =
    tarea.descripcion.length > LARGO_MAX_RESUMEN
      ? tarea.descripcion.slice(0, LARGO_MAX_RESUMEN).trimEnd() + "…"
      : tarea.descripcion;

  return (
    <div className={"task-card" + (tarea.completada ? " task-card--done" : "")}>
      {pidiendoConfirmacion ? (
        <ConfirmDelete
          onConfirmar={() => eliminarTarea(tarea.id)}
          onCancelar={() => setPidiendoConfirmacion(false)}
        />
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-start gap-2">
            <Link to={`/tarea/${tarea.id}`} className="task-card__titulo">
              {tarea.titulo}
            </Link>
            <span
              className={
                "badge rounded-pill " +
                (tarea.completada ? "badge-done" : "badge-pending")
              }
            >
              {tarea.completada ? "Completa" : "Incompleta"}
            </span>
          </div>

          <p className="task-card__descripcion">{descripcionCorta}</p>

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <small className="task-card__fecha">
              Creada el {formatearFecha(tarea.fechaCreacion)}
            </small>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-theme"
                onClick={() => alternarEstado(tarea.id)}
              >
                {tarea.completada ? "Marcar incompleta" : "Marcar completa"}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => setPidiendoConfirmacion(true)}
                aria-label={`Eliminar tarea ${tarea.titulo}`}
              >
                🗑️
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TaskCard;
