/**
 * scripts/main.js — Ejercicio 1
 * Inicializa el tema y el botón scroll-to-top.
 */
import { initEjercicio1 } from "./ejercicio1.js";

// ── TEMA ──────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("theme-stylesheet").href = `/styles/${theme}.css`;
  document.getElementById("themeIcon").className =
    theme === "dark" ? "bi bi-moon-fill" : "bi bi-sun-fill";
  localStorage.setItem("theme", theme);
}

function initTheme() {
  applyTheme(localStorage.getItem("theme") || "dark");
  document.getElementById("themeToggle").addEventListener("click", () => {
    applyTheme(
      document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"
    );
  });
}

// ── SCROLL TOP ────────────────────────────────────────
function initScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  window.addEventListener("scroll", () =>
    btn.classList.toggle("visible", window.scrollY > 300)
  );
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

// ── INIT ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initScrollTop();
  initEjercicio1();
});
