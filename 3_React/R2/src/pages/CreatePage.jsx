/**
 * CreatePage.jsx
 * -----------------------------------------------------------------------
 * De donde viene: ruta "/crear" registrada en `App.jsx`, navegada desde
 *   `Navbar.jsx` y `HomePage.jsx`.
 * A donde va: usa `TaskForm.jsx` para el formulario y `useTasks()` para
 *   agregar la tarea nueva; al terminar, redirige a la página de detalle
 *   de la tarea recién creada.
 * -----------------------------------------------------------------------
 * Página de creación: formulario para dar de alta una nueva tarea.
 */

import { useNavigate, Link } from "react-router-dom";
import TaskForm from "../components/TaskForm";
import { useTasks } from "../hooks/useTasks";

function CreatePage() {
  const navigate = useNavigate();
  const { agregarTarea } = useTasks();

  const manejarGuardar = (datos) => {
    const nueva = agregarTarea(datos);
    navigate(`/tarea/${nueva.id}`);
  };

  return (
    <div className="container-fluid px-3 px-md-5 py-4">
      <Link to="/" className="back-link mb-3 d-inline-block">
        ← Volver al inicio
      </Link>

      <div className="detail-card detail-card--form">
        <h2 className="mb-4">Crear nueva tarea</h2>
        <TaskForm textoBoton="Crear tarea" onGuardar={manejarGuardar} />
      </div>
    </div>
  );
}

export default CreatePage;
