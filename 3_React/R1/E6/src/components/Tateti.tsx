import { useState } from "react";
import "./Tateti.css";

// Ficha de cada casillero: vacio, X o O
type Ficha = "" | "X" | "O";

// Las 8 combinaciones posibles para ganar (filas, columnas y diagonales)
const LINEAS_GANADORAS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

// Revisa el tablero y devuelve el ganador ("X" u "O"), o null si no hay
function calcularGanador(tablero: Ficha[]): Ficha | null {
    for (const [a, b, c] of LINEAS_GANADORAS) {
        if (tablero[a] && tablero[a] === tablero[b] && tablero[a] === tablero[c]) {
            return tablero[a];
        }
    }
    return null;
}

/**
 * Tateti
 * Juego de tres en linea para dos jugadores en el mismo dispositivo.
 * El tablero se guarda como un arreglo de 9 casilleros en el estado.
 */
function Tateti() {
    const [tablero, setTablero] = useState<Ficha[]>(Array(9).fill(""));
    const [turnoX, setTurnoX] = useState(true);

    const ganador = calcularGanador(tablero);
    const tableroLleno = tablero.every((casillero) => casillero !== "");
    const empate = !ganador && tableroLleno;

    // Coloca la ficha del jugador actual en el casillero elegido
    function jugar(indice: number) {
        if (tablero[indice] || ganador) return;

        const nuevoTablero = [...tablero];
        nuevoTablero[indice] = turnoX ? "X" : "O";

        setTablero(nuevoTablero);
        setTurnoX((anterior) => !anterior);
    }

    // Vuelve a dejar el tablero vacio para jugar de nuevo
    function reiniciar() {
        setTablero(Array(9).fill(""));
        setTurnoX(true);
    }

    let mensaje: string;
    if (ganador) mensaje = `Gano ${ganador}!`;
    else if (empate) mensaje = "Empate!";
    else mensaje = `Turno de ${turnoX ? "X" : "O"}`;

    return (
        <div className="tateti-card">
            <h1>Tateti</h1>

            <p className={`tateti-mensaje ${ganador ? "ganador" : ""}`}>{mensaje}</p>

            <div className="tateti-tablero">
                {tablero.map((ficha, indice) => (
                    <button
                        key={indice}
                        className={`tateti-casillero ${ficha === "X" ? "ficha-x" : ""} ${ficha === "O" ? "ficha-o" : ""}`}
                        onClick={() => jugar(indice)}
                        disabled={ficha !== "" || ganador !== null}
                        aria-label={`Casillero ${indice + 1}`}
                    >
                        {ficha}
                    </button>
                ))}
            </div>

            {(ganador || empate) && (
                <button className="tateti-reiniciar" onClick={reiniciar}>
                    Jugar de nuevo
                </button>
            )}
        </div>
    );
}

export default Tateti;
