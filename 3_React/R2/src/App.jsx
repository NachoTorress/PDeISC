/**
 * App.jsx
 * -----------------------------------------------------------------------
 * De donde viene: renderizado por `main.jsx` dentro de los providers de
 *   contexto y del BrowserRouter.
 * A donde va: define las 3 rutas pedidas por la consigna (inicio,
 *   detalle, creación) usando React Router, y monta los componentes
 *   persistentes (Navbar, botón de scroll).
 * -----------------------------------------------------------------------
 */

import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ScrollToTopButton from "./components/ScrollToTopButton";
import HomePage from "./pages/HomePage";
import DetailPage from "./pages/DetailPage";
import CreatePage from "./pages/CreatePage";

function App() {
  return (
    <div className="app-shell">
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tarea/:id" element={<DetailPage />} />
          <Route path="/crear" element={<CreatePage />} />
          <Route
            path="*"
            element={
              <div className="container-fluid px-3 px-md-5 py-4">
                <div className="empty-state">
                  <p>Página no encontrada.</p>
                </div>
              </div>
            }
          />
        </Routes>
      </main>

      <ScrollToTopButton />
    </div>
  );
}

export default App;
