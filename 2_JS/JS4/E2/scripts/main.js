/**
 * scripts/main.js — Ejercicio 2
 * Inicializa el tema, scroll-top y el ejercicio 2.
 */
import { initEjercicio2 } from "./ejercicio2.js";

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

function initScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  window.addEventListener("scroll", () =>
    btn.classList.toggle("visible", window.scrollY > 300)
  );
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initScrollTop();
  initEjercicio2();
});
