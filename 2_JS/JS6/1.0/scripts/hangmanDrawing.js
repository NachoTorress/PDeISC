/**
 * scripts/hangmanDrawing.js
 * -------------------------------------------------------
 * De donde viene: scripts/hangmanGame.js le avisa cuantos
 *                  intentos fallidos lleva el jugador.
 * A donde va:     scripts/ui.js inyecta el SVG resultante
 *                  dentro del contenedor #dibujo-ahorcado.
 * Que hace:       arma el SVG del muñeco del ahorcado,
 *                  mostrando una parte del cuerpo por cada
 *                  error (maximo 6 errores).
 * -------------------------------------------------------
 */

export const INTENTOS_MAXIMOS = 6;

const PARTES_CUERPO = [
    // cada parte se muestra cuando erroresCount >= indice + 1
    '<circle cx="150" cy="70" r="20" class="parte-ahorcado" />', // cabeza
    '<line x1="150" y1="90" x2="150" y2="150" class="parte-ahorcado" />', // torso
    '<line x1="150" y1="105" x2="120" y2="130" class="parte-ahorcado" />', // brazo izq
    '<line x1="150" y1="105" x2="180" y2="130" class="parte-ahorcado" />', // brazo der
    '<line x1="150" y1="150" x2="125" y2="190" class="parte-ahorcado" />', // pierna izq
    '<line x1="150" y1="150" x2="175" y2="190" class="parte-ahorcado" />', // pierna der
];

const BASE_HORCA = `
    <line x1="20" y1="230" x2="120" y2="230" class="base-ahorcado" />
    <line x1="60" y1="230" x2="60" y2="20" class="base-ahorcado" />
    <line x1="60" y1="20" x2="150" y2="20" class="base-ahorcado" />
    <line x1="150" y1="20" x2="150" y2="50" class="base-ahorcado" />
`;

/**
 * Genera el markup SVG del ahorcado segun la cantidad de errores.
 * @param {number} errores cantidad de intentos fallidos (0 a 6)
 * @returns {string} markup SVG completo
 */
export function generarSvgAhorcado(errores) {
    const partesVisibles = PARTES_CUERPO.slice(0, errores).join('\n');
    return `
        <svg viewBox="0 0 220 240" xmlns="http://www.w3.org/2000/svg" class="svg-ahorcado" role="img" aria-label="Dibujo del ahorcado">
            ${BASE_HORCA}
            ${partesVisibles}
        </svg>
    `;
}
