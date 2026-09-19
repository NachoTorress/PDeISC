/**
 * useTheme.js
 * -----------------------------------------------------------------------
 * De donde viene: consume el valor provisto por `ThemeContext.jsx`.
 * A donde va: usado por `Navbar.jsx` para el botón de alternar tema.
 * -----------------------------------------------------------------------
 */

import { useContext } from "react";
import { ThemeContext } from "../contexts/ThemeContext";

export function useTheme() {
  const contexto = useContext(ThemeContext);
  if (!contexto) {
    throw new Error("useTheme debe usarse dentro de un ThemeProvider");
  }
  return contexto;
}
