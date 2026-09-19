/**
 * TaskForm.jsx
 * -----------------------------------------------------------------------
 * De donde viene: usado por `CreatePage.jsx` (alta) y por `DetailPage.jsx`
 *   (edición, cuando el usuario activa el modo edición).
 * A donde va: al enviarse, invoca el callback `onGuardar` recibido por
 *   props con los datos ya validados.
 * -----------------------------------------------------------------------
 * Formulario controlado con validación EN TIEMPO REAL (no recién al
 * enviar): cada campo se valida en cada cambio (`onChange`) y también al
 * perder el foco (`onBlur`), marcando el input en rojo y mostrando un
 * mensaje de error claro debajo, tal como pide la consigna.
 */

import { useState } from "react";
import { validarTitulo, validarDescripcion } from "../utils/validators";

function TaskForm({ valoresIniciales, textoBoton, onGuardar, onCancelar }) {
  const [titulo, setTitulo] = useState(valoresIniciales?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(
    valoresIniciales?.descripcion ?? ""
  );
  const [completada, setCompletada] = useState(
    valoresIniciales?.completada ?? false
  );

  const [errores, setErrores] = useState({ titulo: "", descripcion: "" });
  const [tocado, setTocado] = useState({ titulo: false, descripcion: false });

  const manejarCambioTitulo = (e) => {
    const valor = e.target.value;
    setTitulo(valor);
    setErrores((prev) => ({ ...prev, titulo: validarTitulo(valor) }));
  };

  const manejarCambioDescripcion = (e) => {
    const valor = e.target.value;
    setDescripcion(valor);
    setErrores((prev) => ({ ...prev, descripcion: validarDescripcion(valor) }));
  };

  const formularioValido =
    !validarTitulo(titulo) && !validarDescripcion(descripcion);

  const manejarEnvio = (e) => {
    e.preventDefault();
    setTocado({ titulo: true, descripcion: true });

    const errorTitulo = validarTitulo(titulo);
    const errorDescripcion = validarDescripcion(descripcion);
    setErrores({ titulo: errorTitulo, descripcion: errorDescripcion });

    if (errorTitulo || errorDescripcion) return;

    onGuardar({ titulo, descripcion, completada });
  };

  return (
    <form onSubmit={manejarEnvio} noValidate>
      <div className="mb-3">
        <label htmlFor="campo-titulo" className="form-label">
          Título de la tarea
        </label>
        <input
          id="campo-titulo"
          type="text"
          className={
            "form-control" +
            (tocado.titulo && errores.titulo ? " is-invalid" : "") +
            (tocado.titulo && !errores.titulo && titulo ? " is-valid" : "")
          }
          value={titulo}
          onChange={manejarCambioTitulo}
          onBlur={() => setTocado((p) => ({ ...p, titulo: true }))}
          maxLength={60}
        />
        {tocado.titulo && errores.titulo && (
          <div className="invalid-feedback">{errores.titulo}</div>
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="campo-descripcion" className="form-label">
          Descripción
        </label>
        <textarea
          id="campo-descripcion"
          className={
            "form-control" +
            (tocado.descripcion && errores.descripcion ? " is-invalid" : "") +
            (tocado.descripcion && !errores.descripcion && descripcion
              ? " is-valid"
              : "")
          }
          rows={4}
          value={descripcion}
          onChange={manejarCambioDescripcion}
          onBlur={() => setTocado((p) => ({ ...p, descripcion: true }))}
          maxLength={300}
        />
        {tocado.descripcion && errores.descripcion && (
          <div className="invalid-feedback">{errores.descripcion}</div>
        )}
      </div>

      <div className="form-check mb-4">
        <input
          id="campo-completada"
          type="checkbox"
          className="form-check-input"
          checked={completada}
          onChange={(e) => setCompletada(e.target.checked)}
        />
        <label htmlFor="campo-completada" className="form-check-label">
          Marcar como completa
        </label>
      </div>

      <div className="d-flex gap-2">
        <button
          type="submit"
          className="btn btn-theme-primary"
          disabled={!formularioValido}
        >
          {textoBoton}
        </button>
        {onCancelar && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancelar}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

export default TaskForm;
