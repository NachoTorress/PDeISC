/**
 * initialTasks.js
 * -----------------------------------------------------------------------
 * De donde viene: datos semilla utilizados la primera vez que la app se
 *   ejecuta (cuando todavía no existe nada guardado en localStorage).
 * A donde va: es consumido por `TasksContext` para inicializar el estado
 *   global de tareas.
 * -----------------------------------------------------------------------
 */

const initialTasks = [
  {
    id: 1,
    titulo: "Aprender React Router",
    descripcion:
      "Repasar la documentación oficial de React Router y practicar rutas anidadas.",
    completada: false,
    fechaCreacion: new Date().toISOString(),
  },
  {
    id: 2,
    titulo: "Preparar entrega del TP",
    descripcion:
      "Revisar que la aplicación cumpla con todos los requerimientos pedidos por la cátedra.",
    completada: true,
    fechaCreacion: new Date().toISOString(),
  },
];

export default initialTasks;
