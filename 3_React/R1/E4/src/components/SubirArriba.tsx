import { useEffect, useState } from "react";
import "./SubirArriba.css";

// A partir de cuantos pixels de scroll aparece el boton
const UMBRAL_SCROLL = 300;

/**
 * SubirArriba
 * Boton flotante que aparece cuando el usuario scrollea hacia abajo
 * y, al hacer click, lo lleva de nuevo al principio de la pagina.
 */
function SubirArriba() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        function manejarScroll() {
            setVisible(window.scrollY > UMBRAL_SCROLL);
        }

        window.addEventListener("scroll", manejarScroll);
        return () => window.removeEventListener("scroll", manejarScroll);
    }, []);

    function subirArriba() {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (!visible) return null;

    return (
        <button
            className="subir-arriba"
            onClick={subirArriba}
            aria-label="Subir al principio de la pagina"
        >
            ↑
        </button>
    );
}

export default SubirArriba;