import { useState } from "react";
import "./holaMundo.css";

// Estilos disponibles para el texto, se van rotando con el boton
const ESTILOS = ["degradado", "neon", "contorno", "relieve"] as const;
type Estilo = (typeof ESTILOS)[number];

/**
 * HolaMundo
 * Muestra el clasico saludo "Hola, mundo!" y permite ir probando
 * distintos estilos de CSS sobre el mismo texto con un solo click.
 */
function HolaMundo() {
    const [indice, setIndice] = useState(0);
    const estilo: Estilo = ESTILOS[indice];

    // Pasa al siguiente estilo de la lista (vuelve al principio al llegar al final)
    function siguienteEstilo() {
        setIndice((anterior) => (anterior + 1) % ESTILOS.length);
    }

    return (
        <div className="hola-wrapper">
            <h1 className={`hola-titulo estilo-${estilo}`} data-text="Hola, mundo!">
                Hola, mundo!
            </h1>

            <button className="hola-boton" onClick={siguienteEstilo}>
                Cambiar estilo · <span>{estilo}</span>
            </button>
        </div>
    );
}

export default HolaMundo;
