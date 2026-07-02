/**
 * scripts/hangmanGame.js
 * -------------------------------------------------------
 * De donde viene: scripts/main.js crea una instancia de
 *                  JuegoAhorcado al cargar la pagina y cada
 *                  vez que se presiona "Jugar de nuevo".
 * A donde va:     scripts/ui.js consulta el estado de esta
 *                  clase para pintar la pantalla, y le avisa
 *                  cada letra que el usuario presiona.
 * Que hace:       encapsula toda la logica pura del juego
 *                  (letras adivinadas, intentos, puntaje,
 *                  tiempo), separada del manejo del DOM.
 * -------------------------------------------------------
 */

import { INTENTOS_MAXIMOS } from './hangmanDrawing.js';

export class JuegoAhorcado {
    /**
     * @param {{palabra: string, categoria: string, pista: string}} datosPalabra
     */
    constructor(datosPalabra) {
        this.palabra = datosPalabra.palabra.toUpperCase();
        this.categoria = datosPalabra.categoria;
        this.pista = datosPalabra.pista;

        this.letrasAdivinadas = new Set();
        this.letrasFalladas = new Set();
        this.errores = 0;
        this.terminado = false;
        this.gano = false;

        this.tiempoInicio = Date.now();
    }

    /**
     * Procesa el intento de una letra.
     * @param {string} letra
     * @returns {'ya-usada'|'acierto'|'error'} resultado del intento
     */
    intentarLetra(letra) {
        const letraNormalizada = letra.toUpperCase();

        if (this.letrasAdivinadas.has(letraNormalizada) || this.letrasFalladas.has(letraNormalizada)) {
            return 'ya-usada';
        }

        if (this.palabra.includes(letraNormalizada)) {
            this.letrasAdivinadas.add(letraNormalizada);
            if (this.verificarVictoria()) {
                this.terminado = true;
                this.gano = true;
            }
            return 'acierto';
        }

        this.letrasFalladas.add(letraNormalizada);
        this.errores += 1;
        if (this.errores >= INTENTOS_MAXIMOS) {
            this.terminado = true;
            this.gano = false;
        }
        return 'error';
    }

    /**
     * Chequea si todas las letras de la palabra ya fueron adivinadas.
     * @returns {boolean}
     */
    verificarVictoria() {
        return [...this.palabra].every((letra) => letra === ' ' || this.letrasAdivinadas.has(letra));
    }

    /**
     * Arma el string de la palabra con guiones bajos para las letras ocultas.
     * @returns {string}
     */
    obtenerPalabraOculta() {
        return [...this.palabra]
            .map((letra) => (letra === ' ' ? '  ' : this.letrasAdivinadas.has(letra) ? letra : '_'))
            .join(' ');
    }

    /**
     * Devuelve los intentos restantes.
     * @returns {number}
     */
    obtenerIntentosRestantes() {
        return INTENTOS_MAXIMOS - this.errores;
    }

    /**
     * Calcula el tiempo transcurrido desde que empezo la partida, en segundos.
     * @returns {number}
     */
    obtenerTiempoTranscurrido() {
        return Math.floor((Date.now() - this.tiempoInicio) / 1000);
    }

    /**
     * Calcula el puntaje final segun intentos restantes y tiempo empleado.
     * Formula: 150 puntos por cada intento restante, mas un bonus por
     * velocidad (hasta 500 puntos, restando 5 por cada segundo transcurrido).
     * Si el jugador perdio, el puntaje es 0.
     * @returns {number}
     */
    calcularPuntaje() {
        if (!this.gano) return 0;
        const tiempo = this.obtenerTiempoTranscurrido();
        const bonusVelocidad = Math.max(0, 500 - tiempo * 5);
        return this.obtenerIntentosRestantes() * 150 + bonusVelocidad;
    }
}
