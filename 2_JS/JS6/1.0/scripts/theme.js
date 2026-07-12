/**
 * scripts/theme.js
 * -------------------------------------------------------
 * De donde viene: se activa con el click del switch de tema
 *                  en la navbar (pages/index.html).
 * A donde va:     cambia el atributo "data-theme" del <html>,
 *                  que es leido por styles/light.css y
 *                  styles/dark.css para aplicar los colores.
 * Que hace:       persiste la preferencia del usuario en
 *                  localStorage para que se mantenga entre
 *                  visitas.
 * -------------------------------------------------------
 */

const CLAVE_STORAGE = 'ahorcado-tema';

/**
 * Aplica el tema indicado al documento y guarda la preferencia.
 * @param {'claro'|'oscuro'} tema
 */
function aplicarTema(tema) {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem(CLAVE_STORAGE, tema);

    const icono = document.getElementById('icono-tema');
    if (icono) {
        icono.className = tema === 'oscuro' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
    }

    const interruptor = document.getElementById('switch-tema');
    if (interruptor) {
        interruptor.checked = tema === 'oscuro';
    }
}

/**
 * Inicializa el tema al cargar la pagina, respetando la
 * preferencia guardada o la del sistema operativo.
 */
export function inicializarTema() {
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const temaInicial = guardado || (prefiereOscuro ? 'oscuro' : 'claro');
    aplicarTema(temaInicial);

    const interruptor = document.getElementById('switch-tema');
    if (interruptor) {
        interruptor.addEventListener('change', () => {
            aplicarTema(interruptor.checked ? 'oscuro' : 'claro');
        });
    }
}
