/**
 * main.jsx
 * -----------------------------------------------------------------------
 * De donde viene: es el punto de entrada indicado por `index.html`
 *   (`<script type="module" src="/src/main.jsx">`).
 * A donde va: monta `App.jsx` dentro del único contenedor
 *   `<div id="root">` del `index.html`, envuelto por el BrowserRouter y
 *   los providers de contexto (tema y tareas).
 * -----------------------------------------------------------------------
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import App from "./App.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { TasksProvider } from "./contexts/TasksContext.jsx";
import "./styles/light.css";
import "./styles/dark.css";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <TasksProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </TasksProvider>
    </ThemeProvider>
  </StrictMode>
);
