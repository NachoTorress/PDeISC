import { useState } from "react";
import "./Contador.css";

/**
 * Contador
 * Muestra un valor numerico que el usuario puede incrementar o decrementar.
 * El valor se guarda en el estado local del componente con useState.
 */
function Contador() {
    // Estado que guarda el valor actual del contador
    const [valor, setValor] = useState(0);

    // Suma 1 al valor actual
    function incrementar() {
        setValor((anterior) => anterior + 1);
    }

    // Resta 1 al valor actual
    function decrementar() {
        setValor((anterior) => anterior - 1);
    }

    // Vuelve el contador a 0
    function reiniciar() {
        setValor(0);
    }

    return (
        <div className="contador-card">
            <h1>Contador</h1>

            <p className={`contador-valor ${valor < 0 ? "negativo" : ""}`}>
                {valor}
            </p>

            <div className="contador-botones">
                <button onClick={decrementar} aria-label="Decrementar">
                    −
                </button>
                <button onClick={reiniciar} className="reiniciar">
                    Reiniciar
                </button>
                <button onClick={incrementar} aria-label="Incrementar">
                    +
                </button>
            </div>
        </div>
    );
}

export default Contador;
