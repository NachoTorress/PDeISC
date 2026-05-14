/**
 * modulos/menuModule.js
 * Módulo propio que genera el HTML del menú de navegación
 * y provee utilidades relacionadas a la navegación del sitio.
 *
 * Uso:
 *   const menu = require('./modulos/menuModule');
 *   const htmlNav = menu.renderMenu('/nosotros');
 */

// ── Definición de los ítems del menú ─────────────────────────────────────────
/**
 * @typedef  {Object} MenuItem
 * @property {string} label  - Texto visible en el menú
 * @property {string} href   - Ruta URL del enlace
 * @property {string} icon   - Clase de icono Bootstrap Icons
 */

/** @type {MenuItem[]} */
const MENU_ITEMS = [
  { label: "Inicio",    href: "/",         icon: "bi-house-door"   },
  { label: "Menú",      href: "/menu",     icon: "bi-journal-text" },
  { label: "Nosotros",  href: "/nosotros", icon: "bi-people"       },
  { label: "Galería",   href: "/galeria",  icon: "bi-images"       },
  { label: "Eventos",   href: "/eventos",  icon: "bi-calendar-event" },
  { label: "Contacto",  href: "/contacto", icon: "bi-envelope"     },
];

// ── Funciones exportadas ──────────────────────────────────────────────────────

/**
 * Genera el HTML completo de la barra de navegación.
 * Marca como "activo" el ítem cuyo href coincide con la ruta actual.
 *
 * @param   {string} currentPath - Ruta activa (p.ej. "/nosotros")
 * @returns {string}             - HTML de la navbar de Bootstrap
 */
function renderMenu(currentPath) {
  // Construir los <li> de cada enlace
  const itemsHtml = MENU_ITEMS.map((item) => {
    const isActive  = item.href === currentPath;
    const activeClass = isActive ? " active" : "";
    const ariaCurrent = isActive ? ' aria-current="page"' : "";

    return `
        <li class="nav-item">
          <a class="nav-link${activeClass}"${ariaCurrent} href="${item.href}">
            <i class="${item.icon} me-1"></i>${item.label}
          </a>
        </li>`;
  }).join("\n");

  // HTML completo de la navbar
  return `
  <!-- ═══════════════════════════════════════════════════
       Navbar generada por menuModule.js
       Módulo propio de navegación — Café Aurora
  ═══════════════════════════════════════════════════ -->
  <nav class="navbar navbar-expand-lg navbar-dark fixed-top" id="mainNav">
    <div class="container">

      <!-- Logotipo / Marca -->
      <a class="navbar-brand" href="/">
        <span class="brand-icon">☕</span>
        <span class="brand-text">Café Aurora</span>
      </a>

      <!-- Botón hamburguesa para móviles -->
      <button class="navbar-toggler" type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarMain"
              aria-controls="navbarMain"
              aria-expanded="false"
              aria-label="Abrir navegación">
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Ítems del menú -->
      <div class="collapse navbar-collapse" id="navbarMain">
        <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
          ${itemsHtml}
        </ul>
      </div>

    </div>
  </nav>
  <!-- ═══════════════════════════════════════════════════ -->
  `;
}

/**
 * Devuelve el listado de ítems del menú como objeto JavaScript.
 * Útil para depuración o para generar menús dinámicos.
 *
 * @returns {MenuItem[]} Arreglo con todos los ítems del menú
 */
function getMenuItems() {
  return MENU_ITEMS;
}

/**
 * Devuelve un resumen de texto del menú para mostrar en consola.
 * @returns {string}
 */
function getMenuInfo() {
  const lines = MENU_ITEMS.map(
    (item) => `  • ${item.label.padEnd(12)} → ${item.href}`
  );
  return lines.join("\n");
}

// ── Exportaciones del módulo ──────────────────────────────────────────────────
export const menu = renderMenu('/');

export { renderMenu, getMenuItems, getMenuInfo };