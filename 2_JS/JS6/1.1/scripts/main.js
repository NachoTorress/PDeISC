/**
 * scripts/main.js
 * -------------------------------------------------------
 * De donde viene: es el <script type="module"> cargado desde
 *                  pages/index.html, se ejecuta al abrir la app.
 * A donde va:     orquesta todos los demas modulos (api, ui,
 *                  hangmanGame, leaderboard, theme, validation)
 *                  y conecta los eventos del usuario con la
 *                  logica correspondiente.
 * -------------------------------------------------------
 */

import { pedirPalabra, guardarPuntaje, descargarPdf, obtenerTablaPosiciones } from './api.js';
import { JuegoAhorcado } from './hangmanGame.js';
import {
    generarTeclado,
    actualizarTeclado,
    renderizarPalabra,
    actualizarDibujo,
    mostrarMensajeFinal,
    ocultarMensajeFinal,
    formatearTiempo,
} from './ui.js';
import { renderizarTablaPosiciones, renderizarTop3, descargarTablaComoCSV } from './leaderboard.js';
import { inicializarTema } from './theme.js';
import { validarNombreCliente, conectarValidacionTiempoReal } from './validation.js';

// ---- Referencias al DOM ----
const elCategoria = document.getElementById('categoria-palabra');
const elPista = document.getElementById('pista-palabra');
const elDibujo = document.getElementById('dibujo-ahorcado');
const elPalabraOculta = document.getElementById('palabra-oculta');
const elIntentosRestantes = document.getElementById('intentos-restantes');
const elCronometro = document.getElementById('cronometro');
const elTeclado = document.getElementById('teclado');
const elMensajeFinal = document.getElementById('mensaje-final');
const elPanelResultado = document.getElementById('panel-resultado');
const elFormGuardar = document.getElementById('form-guardar-puntaje');
const elInputNombre = document.getElementById('input-nombre-jugador');
const elErrorNombre = document.getElementById('error-nombre-jugador');
const elBotonGuardar = document.getElementById('btn-guardar-puntaje');
const elResumenPuntos = document.getElementById('resumen-puntos');
const elResumenTiempo = document.getElementById('resumen-tiempo');
const elBotonDescargarPdf = document.getElementById('btn-descargar-pdf');
const elBotonJugarDeNuevo = document.getElementById('btn-jugar-de-nuevo');
const elListaPosiciones = document.getElementById('lista-posiciones');
const elListaTop3 = document.getElementById('lista-top3');
const elBotonSubirArriba = document.getElementById('btn-subir-arriba');
const elCargandoPalabra = document.getElementById('cargando-palabra');
const elAreaJuego = document.getElementById('area-juego');
const elTextoSinResultado = document.getElementById('texto-sin-resultado');
const elBotonDescargarTabla = document.getElementById('btn-descargar-tabla-csv');

let juegoActual = null;
let intervaloCronometro = null;
let ultimoScoreGuardado = null; // guarda { nombre, tiempo, puntos, fecha } para el PDF
let scoresActuales = [];        // cache del ultimo listado obtenido del backend

/**
 * Arranca una partida nueva: pide una palabra al backend y
 * reinicia todo el estado visual.
 */
async function iniciarNuevaPartida() {
    detenerCronometro();
    ocultarMensajeFinal(elMensajeFinal);
    elPanelResultado.classList.add('d-none');
    elTextoSinResultado.classList.remove('d-none');
    elFormGuardar.classList.remove('d-none');
    elBotonDescargarPdf.classList.add('d-none');
    elInputNombre.value = '';
    elInputNombre.classList.remove('is-invalid', 'is-valid');
    elErrorNombre.textContent = '';
    elBotonGuardar.disabled = false;
    elBotonGuardar.textContent = 'Guardar puntaje';
    nombreEsValido = false;
    elBotonJugarDeNuevo.classList.add('d-none');
    elAreaJuego.classList.add('d-none');
    elCargandoPalabra.classList.remove('d-none');

    try {
        const datosPalabra = await pedirPalabra();
        juegoActual = new JuegoAhorcado(datosPalabra);

        elCategoria.textContent = juegoActual.categoria;
        elPista.textContent = juegoActual.pista;

        generarTeclado(elTeclado, manejarIntentoLetra);
        pintarEstadoJuego();
        iniciarCronometro();

        elCargandoPalabra.classList.add('d-none');
        elAreaJuego.classList.remove('d-none');
    } catch (error) {
        elCargandoPalabra.innerHTML = `<div class="alert alert-fallo">No se pudo cargar una palabra. Verifica que el servidor este corriendo.</div>`;
    }
}

/**
 * Procesa el click/tecla de una letra del teclado virtual.
 * @param {string} letra
 */
function manejarIntentoLetra(letra) {
    if (!juegoActual || juegoActual.terminado) return;

    juegoActual.intentarLetra(letra);
    pintarEstadoJuego();

    if (juegoActual.terminado) {
        finalizarPartida();
    }
}

/**
 * Vuelve a pintar todo el estado visual del juego actual.
 */
function pintarEstadoJuego() {
    renderizarPalabra(elPalabraOculta, juegoActual);
    actualizarDibujo(elDibujo, juegoActual);
    actualizarTeclado(elTeclado, juegoActual);
    elIntentosRestantes.textContent = juegoActual.obtenerIntentosRestantes();
}

/**
 * Inicia el cronometro visual que se actualiza cada segundo.
 */
function iniciarCronometro() {
    elCronometro.textContent = '00:00';
    intervaloCronometro = setInterval(() => {
        elCronometro.textContent = formatearTiempo(juegoActual.obtenerTiempoTranscurrido());
    }, 1000);
}

function detenerCronometro() {
    if (intervaloCronometro) {
        clearInterval(intervaloCronometro);
        intervaloCronometro = null;
    }
}

/**
 * Se ejecuta cuando el juego termina (ganado o perdido):
 * detiene el cronometro, muestra el mensaje final y habilita
 * el panel para guardar el puntaje.
 */
function finalizarPartida() {
    detenerCronometro();
    mostrarMensajeFinal(elMensajeFinal, juegoActual);

    const puntos = juegoActual.calcularPuntaje();
    const tiempo = juegoActual.obtenerTiempoTranscurrido();

    elResumenPuntos.textContent = puntos;
    elResumenTiempo.textContent = formatearTiempo(tiempo);

    elPanelResultado.classList.remove('d-none');
    elTextoSinResultado.classList.add('d-none');
    elBotonJugarDeNuevo.classList.remove('d-none');
}

/**
 * Refresca la tabla de posiciones pidiendo los datos al backend.
 */
async function actualizarTablaPosiciones() {
    try {
        const scores = await obtenerTablaPosiciones();
        scoresActuales = scores;
        renderizarTablaPosiciones(elListaPosiciones, scores);
        renderizarTop3(elListaTop3, scores);
    } catch (error) {
        elListaPosiciones.innerHTML = `<div class="alert alert-fallo">No se pudo cargar la tabla de posiciones.</div>`;
    }
}

// ---- Validacion en tiempo real del nombre para guardar puntaje ----
let nombreEsValido = false;
conectarValidacionTiempoReal(elInputNombre, elErrorNombre, validarNombreCliente, (esValido) => {
    nombreEsValido = esValido;
});

// ---- Evento: guardar puntaje (boton de uso unico por partida) ----
elFormGuardar.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!nombreEsValido) return;

    const nombre = elInputNombre.value.trim();
    const tiempo = juegoActual.obtenerTiempoTranscurrido();
    const puntos = juegoActual.calcularPuntaje();

    elBotonGuardar.disabled = true;
    elBotonGuardar.textContent = 'Guardando...';

    try {
        const scoreGuardado = await guardarPuntaje({ nombre, tiempo, puntos });
        ultimoScoreGuardado = {
            nombre: scoreGuardado.nombre,
            tiempo: scoreGuardado.tiempo,
            puntos: scoreGuardado.puntos,
            fecha: scoreGuardado.fecha,
        };

        // El boton de guardar es de uso unico: una vez usado, se oculta.
        elFormGuardar.classList.add('d-none');
        elBotonDescargarPdf.classList.remove('d-none');

        await actualizarTablaPosiciones();
    } catch (error) {
        elErrorNombre.textContent = error.message;
        elBotonGuardar.disabled = false;
        elBotonGuardar.textContent = 'Guardar puntaje';
    }
});

// ---- Evento: descargar PDF del score actual ----
elBotonDescargarPdf.addEventListener('click', async () => {
    if (!ultimoScoreGuardado) return;
    elBotonDescargarPdf.disabled = true;
    try {
        await descargarPdf(ultimoScoreGuardado);
    } catch (error) {
        console.error(error);
    } finally {
        elBotonDescargarPdf.disabled = false;
    }
});

// ---- Evento: descargar tabla completa como CSV ----
elBotonDescargarTabla.addEventListener('click', () => {
    descargarTablaComoCSV(scoresActuales);
});

// ---- Evento: jugar de nuevo ----
elBotonJugarDeNuevo.addEventListener('click', iniciarNuevaPartida);

// ---- Soporte de teclado fisico ----
document.addEventListener('keydown', (evento) => {
    const letra = evento.key.toUpperCase();
    if (/^[A-ZÑ]$/.test(letra)) {
        manejarIntentoLetra(letra);
    }
});

// ---- Boton "subir arriba" ----
window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
        elBotonSubirArriba.classList.add('visible');
    } else {
        elBotonSubirArriba.classList.remove('visible');
    }
});
elBotonSubirArriba.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ---- Inicializacion general de la app ----
inicializarTema();
iniciarNuevaPartida();
actualizarTablaPosiciones();