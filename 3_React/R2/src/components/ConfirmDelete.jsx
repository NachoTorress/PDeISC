/**
 * ConfirmDelete.jsx
 * -----------------------------------------------------------------------
 * De donde viene: se usa dentro de `TaskCard.jsx` y de `DetailPage.jsx`
 *   cuando el usuario pide eliminar una tarea.
 * A donde va: al confirmar, invoca el callback `onConfirmar` recibido
 *   por props (que en la práctica llama a `eliminarTarea` del contexto).
 * -----------------------------------------------------------------------
 * Reemplaza al `confirm()` nativo del navegador (prohibido por la
 * consigna) por una confirmación estilizada, integrada dentro de la
 * misma tarjeta de la tarea.
 */

function ConfirmDelete({ onConfirmar, onCancelar }) {
  return (
    <div className="confirm-delete-box" role="alertdialog" aria-live="assertive">
      <p className="mb-2 fw-semibold">¿Estás seguro que querés eliminar esta tarea?</p>
      <div className="d-flex gap-2">
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={onConfirmar}
        >
          Sí, eliminar
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onCancelar}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default ConfirmDelete;
