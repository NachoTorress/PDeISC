import { useState } from "react";
import type { FormEvent } from "react";
import "./FormularioNombre.css";

/**
 * FormularioNombre
 * Captura el nombre del usuario en un input controlado y, al enviar
 * el formulario, muestra un mensaje de bienvenida personalizado.
 */
function FormularioNombre() {
    // Valor actual del input, controlado por el estado
    const [nombre, setNombre] = useState("");
    // Nombre ya enviado, usado para armar el mensaje de bienvenida
    const [nombreEnviado, setNombreEnviado] = useState<string | null>(null);

    function manejarEnvio(evento: FormEvent) {
        evento.preventDefault();

        const nombreLimpio = nombre.trim();
        if (nombreLimpio === "") return;

        setNombreEnviado(nombreLimpio);
    }

    // Permite volver a completar el formulario desde cero
    function reiniciar() {
        setNombreEnviado(null);
        setNombre("");
    }

    return (
        <div className="form-card">
            {nombreEnviado ? (
                <div className="bienvenida">
                    <h1>¡Bienvenido/a, {nombreEnviado}! 👋</h1>
                    <button onClick={reiniciar}>Ingresar otro nombre</button>
                </div>
            ) : (
                <form onSubmit={manejarEnvio}>
                    <h1>¿Cual es tu nombre?</h1>

                    <label htmlFor="nombre">Nombre</label>
                    <input
                        id="nombre"
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                    />

                    <button type="submit" disabled={nombre.trim() === ""}>
                        Continuar
                    </button>
                </form>
            )}
        </div>
    );
}

export default FormularioNombre;
