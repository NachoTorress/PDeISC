import { useState } from "react";
import type { FormEvent } from "react";
import "./ListaTareas.css";

// Forma de cada tarea guardada en el estado
type Tarea = {
    id: number;
    texto: string;
    completada: boolean;
};

/**
 * ListaTareas
 * Permite escribir una tarea, agregarla a un listado y marcarla
 * como completada o eliminarla. Todo el listado vive en el estado
 * del componente, guardado como un arreglo de objetos Tarea.
 */
function ListaTareas() {
    const [tareas, setTareas] = useState<Tarea[]>([]);
    const [textoNuevo, setTextoNuevo] = useState("");

    // Agrega una nueva tarea al arreglo, evitando textos vacios
    function agregarTarea(evento: FormEvent) {
        evento.preventDefault();

        const texto = textoNuevo.trim();
        if (texto === "") return;

        const nuevaTarea: Tarea = {
            id: Date.now(),
            texto,
            completada: false,
        };

        setTareas((anteriores) => [...anteriores, nuevaTarea]);
        setTextoNuevo("");
    }

    // Invierte el estado "completada" de la tarea indicada
    function alternarCompletada(id: number) {
        setTareas((anteriores) =>
            anteriores.map((tarea) =>
                tarea.id === id ? { ...tarea, completada: !tarea.completada } : tarea
            )
        );
    }

    // Elimina una tarea del arreglo
    function eliminarTarea(id: number) {
        setTareas((anteriores) => anteriores.filter((tarea) => tarea.id !== id));
    }

    const pendientes = tareas.filter((t) => !t.completada).length;

    return (
        <div className="tareas-card">
            <h1>Lista de tareas</h1>

            <form className="tareas-form" onSubmit={agregarTarea}>
                <label htmlFor="nueva-tarea" className="sr-only">
                    Nueva tarea
                </label>
                <input
                    id="nueva-tarea"
                    type="text"
                    value={textoNuevo}
                    onChange={(e) => setTextoNuevo(e.target.value)}
                    placeholder="Escribi una tarea..."
                />
                <button type="submit">Agregar</button>
            </form>

            {tareas.length === 0 ? (
                <p className="tareas-vacio">Todavia no agregaste tareas.</p>
            ) : (
                <>
                    <ul className="tareas-lista">
                        {tareas.map((tarea) => (
                            <li
                                key={tarea.id}
                                className={tarea.completada ? "completada" : ""}
                            >
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={tarea.completada}
                                        onChange={() => alternarCompletada(tarea.id)}
                                    />
                                    <span>{tarea.texto}</span>
                                </label>

                                <button
                                    className="tareas-eliminar"
                                    onClick={() => eliminarTarea(tarea.id)}
                                    aria-label={`Eliminar tarea ${tarea.texto}`}
                                >
                                    ✕
                                </button>
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
