/**
 * ThemeContext.jsx
 * -----------------------------------------------------------------------
 * De donde viene: se monta en `main.jsx`, envolviendo toda la aplicación.
 * A donde va: cualquier componente puede consumir `useTheme()` (definido
 *   en `hooks/useTheme.js`) para leer o cambiar el tema actual.
 * -----------------------------------------------------------------------
 * Guarda el tema elegido por el usuario en localStorage para que se
 * mantenga entre visitas, y lo aplica como atributo `data-theme` en el
 * elemento raíz del documento (usado por los CSS de tema claro/oscuro).
 */

import { createContext, useEffect, useState } from "react";

export const ThemeContext = createContext(null);

const CLAVE_STORAGE = "tasks-app:theme";

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => {
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    if (guardado) return guardado;
    const prefiereOscuro = window.matchMedia?.(
      "(prefers-color-scheme: dark)"
    ).matches;
    return prefiereOscuro ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);
    localStorage.setItem(CLAVE_STORAGE, tema);
  }, [tema]);

  const alternarTema = () => {
    setTema((actual) => (actual === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ tema, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  );
}
