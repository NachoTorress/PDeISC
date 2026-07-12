/**
 * scripts/ui.js
 * -------------------------------------------------------
 * De donde viene: scripts/main.js llama a estas funciones
 *                  cada vez que cambia el estado del juego
 *                  (instancia de JuegoAhorcado).
 * A donde va:     pinta directamente sobre los elementos del
 *                  DOM definidos en pages/index.html.
 * Que hace:       separa toda la manipulacion visual del
 *                  juego (teclado, palabra oculta, dibujo,
 *                  mensajes) de la logica pura del juego.
 * -------------------------------------------------------
 */

import { generarSvgAhorcado } from './hangmanDrawing.js';

const ABECEDARIO = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

/**
 * Genera dinamicamente los botones del teclado virtual.
 * @param {HTMLElement} contenedor
 * @param {(letra: string) => void} alPresionarLetra
 */
export function generarTeclado(contenedor, alPresionarLetra) {
    contenedor.innerHTML = '';
    ABECEDARIO.forEach((letra) => {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'btn boton-letra';
        boton.textContent = letra;
        boton.dataset.letra = letra;
        boton.addEventListener('click', () => alPresionarLetra(letra));
        contenedor.appendChild(boton);
    });
}

/**
 * Actualiza el estado visual (deshabilitado / correcto / incorrecto)
 * de cada tecla segun el estado actual del juego.
 * @param {HTMLElement} contenedor
 * @param {import('./hangmanGame.js').JuegoAhorcado} juego
 */
export function actualizarTeclado(contenedor, juego) {
    const botones = contenedor.querySelectorAll('.boton-letra');
    botones.forEach((boton) => {
        const letra = boton.dataset.letra;
        boton.classList.remove('acierto', 'error');
        if (juego.letrasAdivinadas.has(letra)) {
            boton.classList.add('acierto');
            boton.disabled = true;
        } else if (juego.letrasFalladas.has(letra)) {
            boton.classList.add('error');
            boton.disabled = true;
        } else {
            boton.disabled = juego.terminado;
        }
    });
}

/**
 * Pinta la palabra oculta (con guiones bajos) en pantalla.
 * @param {HTMLElement} contenedor
 * @param {import('./hangmanGame.js').JuegoAhorcado} juego
 */
export function renderizarPalabra(contenedor, juego) {
    contenedor.textContent = juego.obtenerPalabraOculta();
}

/**
 * Actualiza el dibujo SVG del ahorcado segun los errores actuales.
 * @param {HTMLElement} contenedor
 * @param {import('./hangmanGame.js').JuegoAhorcado} juego
 */
export function actualizarDibujo(contenedor, juego) {
    contenedor.innerHTML = generarSvgAhorcado(juego.errores);
}

/**
 * Muestra el mensaje de fin de partida (ganada o perdida) sin usar alert().
 * @param {HTMLElement} contenedor
 * @param {import('./hangmanGame.js').JuegoAhorcado} juego
 */
export function mostrarMensajeFinal(contenedor, juego) {
    contenedor.innerHTML = '';
    const alerta = document.createElement('div');

    if (juego.gano) {
        alerta.className = 'alert alert-exito mb-0';
        alerta.innerHTML = `<strong>🎉 ¡Ganaste!</strong> Adivinaste la palabra <strong>${juego.palabra}</strong>.`;
    } else {
        alerta.className = 'alert alert-fallo mb-0';
        alerta.innerHTML = `<strong>💀 Perdiste.</strong> La palabra era <strong>${juego.palabra}</strong>.`;
    }

    contenedor.appendChild(alerta);
    contenedor.classList.remove('d-none');
}

/**
 * Oculta el mensaje de fin de partida (al empezar una nueva).
 * @param {HTMLElement} contenedor
 */
export function ocultarMensajeFinal(contenedor) {
    contenedor.innerHTML = '';
    contenedor.classList.add('d-none');
}

/**
 * Formatea segundos como mm:ss para mostrar el cronometro.
 * @param {number} segundosTotales
 * @returns {string}
 */
export function formatearTiempo(segundosTotales) {
    const minutos = Math.floor(segundosTotales / 60);
    const segundos = segundosTotales % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}
