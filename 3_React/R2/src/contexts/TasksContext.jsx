/**
 * TasksContext.jsx
 * -----------------------------------------------------------------------
 * De donde viene: se monta en `main.jsx`, envolviendo toda la aplicación.
 * A donde va: `HomePage`, `DetailPage` y `CreatePage` consumen
 *   `useTasks()` (definido en `hooks/useTasks.js`) para leer y modificar
 *   la lista de tareas (CRUD completo).
 * -----------------------------------------------------------------------
 * El estado de las tareas vive acá (estado de React, como pide la
 * consigna) y se sincroniza con localStorage para persistir entre
 * recargas de la página.
 */

import { createContext, useEffect, useState } from "react";
import initialTasks from "../data/initialTasks";

export const TasksContext = createContext(null);

const CLAVE_STORAGE = "tasks-app:tasks";

export function TasksProvider({ children }) {
  const [tareas, setTareas] = useState(() => {
    const guardadas = localStorage.getItem(CLAVE_STORAGE);
    return guardadas ? JSON.parse(guardadas) : initialTasks;
  });

  useEffect(() => {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(tareas));
  }, [tareas]);

  /**
   * Agrega una nueva tarea a la lista.
   * @param {{titulo: string, descripcion: string, completada: boolean}} datos
   */
  const agregarTarea = (datos) => {
    const nuevaTarea = {
      id: Date.now(),
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion.trim(),
      completada: datos.completada,
      fechaCreacion: new Date().toISOString(),
    };
    setTareas((previas) => [nuevaTarea, ...previas]);
    return nuevaTarea;
  };

  /**
   * Actualiza una tarea existente por id.
   * @param {number} id
   * @param {object} cambios
   */
  const actualizarTarea = (id, cambios) => {
    setTareas((previas) =>
      previas.map((tarea) =>
        tarea.id === id ? { ...tarea, ...cambios } : tarea
      )
    );
  };

  /**
   * Elimina una tarea por id.
   * @param {number} id
   */
  const eliminarTarea = (id) => {
    setTareas((previas) => previas.filter((tarea) => tarea.id !== id));
  };

  /**
   * Alterna el estado completa/incompleta de una tarea.
   * @param {number} id
   */
  const alternarEstado = (id) => {
    setTareas((previas) =>
      previas.map((tarea) =>
        tarea.id === id ? { ...tarea, completada: !tarea.completada } : tarea
      )
    );
  };

  /**
   * Descarga la lista completa de tareas como archivo JSON.
   * Cumple con el requisito de "archivo descargable".
   */
  const descargarTareas = () => {
    const blob = new Blob([JSON.stringify(tareas, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "tareas.json";
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  };

  const valor = {
    tareas,
    agregarTarea,
    actualizarTarea,
    eliminarTarea,
    alternarEstado,
    descargarTareas,
  };

  return (
    <TasksContext.Provider value={valor}>{children}</TasksContext.Provider>
  );
}
