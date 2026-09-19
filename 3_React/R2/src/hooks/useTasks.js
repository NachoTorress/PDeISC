/**
 * useTasks.js
 * -----------------------------------------------------------------------
 * De donde viene: consume el valor provisto por `TasksContext.jsx`.
 * A donde va: usado por `HomePage`, `DetailPage` y `CreatePage`.
 * -----------------------------------------------------------------------
 */

import { useContext } from "react";
import { TasksContext } from "../contexts/TasksContext";

export function useTasks() {
  const contexto = useContext(TasksContext);
  if (!contexto) {
    throw new Error("useTasks debe usarse dentro de un TasksProvider");
  }
  return contexto;
}
