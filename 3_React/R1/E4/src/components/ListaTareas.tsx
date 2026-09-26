// ListaTareas.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import "./ListaTareas.css";

// Forma de cada tarea guardada en el estado
type Tarea = {
    id: number;
    texto: string;
    completada: boolean;
    creada: number; // timestamp de creacion
};

const MAX_CARACTERES = 100;

/**
 * Valida el texto de una tarea.
 * Origen: inputs de alta y edicion. Destino: mensaje de error (o "" si es valido).
 */
function validarTexto(texto: string): string {
    if (texto.trim() === "") return "La tarea no puede estar vacía.";
    if (texto.length > MAX_CARACTERES)
        return `La tarea no puede superar los ${MAX_CARACTERES} caracteres.`;
    return "";
}

/**
 * Convierte un timestamp a formato DD/MM/AA.
 * Origen: campo "creada" de la tarea. Destino: texto mostrado en la tarjeta.
 */
function formatearFecha(timestamp: number): string {
    const fecha = new Date(timestamp);
    const dd = String(fecha.getDate()).padStart(2, "0");
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const aa = String(fecha.getFullYear()).slice(-2);
    return `${dd}/${mm}/${aa}`;
}

/**
 * ListaTareas
 * CRUD de tareas: crear, leer, editar, completar y eliminar.
 * Solo se puede eliminar una tarea ya completada, y se pide
 * confirmación dentro de la propia tarjeta de la tarea.
 * Todo el listado vive en el estado como un arreglo de Tarea.
 */
function ListaTareas() {
    const [tareas, setTareas] = useState<Tarea[]>([]);
    const [textoNuevo, setTextoNuevo] = useState("");
    const [tocado, setTocado] = useState(false);

    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [textoEdicion, setTextoEdicion] = useState("");
    const [confirmandoId, setConfirmandoId] = useState<number | null>(null);

    const errorNuevo = tocado ? validarTexto(textoNuevo) : "";
    const errorEdicion = editandoId !== null ? validarTexto(textoEdicion) : "";

    // CREATE: agrega una nueva tarea validando el texto
    function agregarTarea(evento: FormEvent) {
        evento.preventDefault();
        setTocado(true);
        if (validarTexto(textoNuevo) !== "") return;

        const ahora = Date.now();
        const nuevaTarea: Tarea = {
            id: ahora,
            texto: textoNuevo.trim(),
            completada: false,
            creada: ahora,
        };

        setTareas((anteriores) => [...anteriores, nuevaTarea]);
        setTextoNuevo("");
        setTocado(false);
    }

    // UPDATE: invierte el estado "completada"; si se desmarca, cancela cualquier confirmación de borrado
    function alternarCompletada(id: number) {
        setTareas((anteriores) =>
            anteriores.map((tarea) =>
                tarea.id === id ? { ...tarea, completada: !tarea.completada } : tarea
            )
        );
        setConfirmandoId((actual) => (actual === id ? null : actual));
    }

    // UPDATE: entra en modo edición de una tarea
    function iniciarEdicion(tarea: Tarea) {
        setEditandoId(tarea.id);
        setTextoEdicion(tarea.texto);
        setConfirmandoId(null);
    }

    // UPDATE: guarda el texto editado si es válido
    function guardarEdicion(id: number) {
        if (validarTexto(textoEdicion) !== "") return;
        setTareas((anteriores) =>
            anteriores.map((tarea) =>
                tarea.id === id ? { ...tarea, texto: textoEdicion.trim() } : tarea
            )
        );
        setEditandoId(null);
    }

    // DELETE: elimina la tarea SOLO si está completada
    function eliminarTarea(id: number) {
        setTareas((anteriores) =>
            anteriores.filter((tarea) => !(tarea.id === id && tarea.completada))
        );
        setConfirmandoId(null);
    }

    const pendientes = tareas.filter((t) => !t.completada).length;

    return (
        <div className="tareas-card">
            <h1>Lista de tareas</h1>

            <form className="tareas-form" onSubmit={agregarTarea} noValidate>
                <div className="tareas-campo">
                    <label htmlFor="nueva-tarea">Nueva tarea</label>
                    <div className="tareas-fila">
                        <input
                            id="nueva-tarea"
                            type="text"
                            value={textoNuevo}
                            className={errorNuevo ? "invalido" : ""}
                            aria-invalid={errorNuevo !== ""}
                            onChange={(e) => {
                                setTextoNuevo(e.target.value);
                                setTocado(true);
                            }}
                        />
                        <button type="submit">Agregar</button>
                    </div>
                    {errorNuevo && <span className="tareas-error">{errorNuevo}</span>}
                </div>
            </form>

            {tareas.length === 0 ? (
                <p className="tareas-vacio">Todavía no agregaste tareas.</p>
            ) : (
                <>
                    <ul className="tareas-lista">
                        {tareas.map((tarea) => (
                            <li
                                key={tarea.id}
                                className={tarea.completada ? "completada" : ""}
                            >
                                {editandoId === tarea.id ? (
                                    <div className="tareas-edicion">
                                        <label htmlFor={`editar-${tarea.id}`}>Editar tarea</label>
                                        <input
                                            id={`editar-${tarea.id}`}
                                            type="text"
                                            value={textoEdicion}
                                            className={errorEdicion ? "invalido" : ""}
                                            aria-invalid={errorEdicion !== ""}
                                            onChange={(e) => setTextoEdicion(e.target.value)}
                                        />
                                        {errorEdicion && (
                                            <span className="tareas-error">{errorEdicion}</span>
                                        )}
                                        <div className="tareas-acciones">
                                            <button
                                                type="button"
                                                className="tareas-btn primario"
                                                disabled={errorEdicion !== ""}
                                                onClick={() => guardarEdicion(tarea.id)}
                                            >
                                                Guardar
                                            </button>
                                            <button
                                                type="button"
                                                className="tareas-btn"
                                                onClick={() => setEditandoId(null)}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : confirmandoId === tarea.id ? (
                                    <div className="tareas-confirmar" role="alertdialog">
                                        <p>¿Estás seguro que querés eliminar esta tarea?</p>
                                        <span className="tareas-texto-conf">{tarea.texto}</span>
                                        <div className="tareas-acciones">
                                            <button
                                                type="button"
                                                className="tareas-btn peligro"
                                                onClick={() => eliminarTarea(tarea.id)}
                                            >
                                                Sí, eliminar
                                            </button>
                                            <button
                                                type="button"
                                                className="tareas-btn"
                                                onClick={() => setConfirmandoId(null)}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="tareas-contenido">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={tarea.completada}
                                                    onChange={() => alternarCompletada(tarea.id)}
                                                />
                                                <span>{tarea.texto}</span>
                                            </label>
                                            <small className="tareas-fecha">
                                                Creada: {formatearFecha(tarea.creada)}
                                            </small>
                                        </div>

                                        <div className="tareas-botones">
                                            <button
                                                type="button"
                                                className="tareas-editar"
                                                onClick={() => iniciarEdicion(tarea)}
                                                aria-label={`Editar tarea ${tarea.texto}`}
                                            >
                                                ✎
                                            </button>
                                            {tarea.completada && (
                                                <button
                                                    type="button"
                                                    className="tareas-eliminar"
                                                    onClick={() => setConfirmandoId(tarea.id)}
                                                    aria-label={`Eliminar tarea ${tarea.texto}`}
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>

                    <p className="tareas-contador">
                        {pendientes} pendiente{pendientes !== 1 ? "s" : ""} de {tareas.length}
                    </p>
                </>
            )}
        </div>
    );
}

export default ListaTareas;