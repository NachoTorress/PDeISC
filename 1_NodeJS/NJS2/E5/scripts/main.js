/**
 * scripts/main.js
 * Script JavaScript global compartido por todas las páginas.
 * - Botón "volver arriba"
 * - Efecto scroll en la navbar
 * - Resaltar ítem activo del menú según URL actual
 */

document.addEventListener("DOMContentLoaded", () => {

  // ── 1. Botón "Volver arriba" ──────────────────────────────────────────────
  const scrollBtn = document.getElementById("scrollTop");

  if (scrollBtn) {
    // Mostrar / ocultar según posición de scroll
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        scrollBtn.classList.add("visible");
      } else {
        scrollBtn.classList.remove("visible");
      }
    });

    // Al hacer clic, desplazar suavemente al tope
    scrollBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ── 2. Efecto de fondo sólido en la navbar al hacer scroll ───────────────
  const navbar = document.getElementById("mainNav");

  if (navbar) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 60) {
        navbar.style.background = "rgba(15, 13, 11, 1)";
      } else {
        navbar.style.background = "rgba(15, 13, 11, 0.95)";
      }
    });
  }

  // ── 3. Marcar enlace activo según la URL actual ───────────────────────────
  // (Complemento por si el servidor no pudo inyectarlo)
  const currentPath = window.location.pathname;
  document.querySelectorAll("#mainNav .nav-link").forEach((link) => {
    const linkPath = new URL(link.href, window.location.origin).pathname;
    if (linkPath === currentPath) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

});