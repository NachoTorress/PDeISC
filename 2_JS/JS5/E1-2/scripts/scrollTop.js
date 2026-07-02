/**
 * scrollTop.js
 * Muestra/oculta el botón de "subir arriba" según el scroll,
 * y realiza el scroll suave cuando se lo presiona.
 * De dónde viene: se inicializa una sola vez desde main.js.
 */

export function inicializarScrollTop() {
  const boton = document.getElementById('btn-scroll-top');

  window.addEventListener('scroll', () => {
    boton.classList.toggle('d-none', window.scrollY < 300);
  });

  boton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
