document.addEventListener('DOMContentLoaded', () => {

  // ─── SELECTORES ───
  const articleStylesheet = document.getElementById('article-theme');
  const btnTheme = document.getElementById('btn-theme-articulo');

  // ─── RUTAS ───
  const URL_CLARO = "../css/articulo.css";
  const URL_OSCURO = "../css/articulo_dark.css";

  // ─── TEMA GUARDADO ───
  const savedTheme = localStorage.getItem('theme-file') || 'claro';

  applyTheme(savedTheme);

  // ─── EVENTO ───
  if (btnTheme) {
    btnTheme.addEventListener('click', toggleTheme);
  }

  // ─────────────────────────────
  // CAMBIAR TEMA
  // ─────────────────────────────
  function toggleTheme() {

    const isDark =
      articleStylesheet.getAttribute('href') === URL_OSCURO;

    const nextTheme = isDark ? 'claro' : 'oscuro';

    applyTheme(nextTheme);
  }

  // ─────────────────────────────
  // APLICAR TEMA
  // ─────────────────────────────
  function applyTheme(theme) {

    if (!articleStylesheet) return;

    if (theme === 'oscuro') {

      articleStylesheet.setAttribute('href', URL_OSCURO);

      localStorage.setItem('theme-file', 'oscuro');

      updateIcons('oscuro');

    } else {

      articleStylesheet.setAttribute('href', URL_CLARO);

      localStorage.setItem('theme-file', 'claro');

      updateIcons('claro');
    }

  }

  // ─────────────────────────────
  // ICONOS
  // ─────────────────────────────
  function updateIcons(theme) {

    if (!btnTheme) return;

    const moon = btnTheme.querySelector('.theme-icon-dark');
    const sun = btnTheme.querySelector('.theme-icon-light');

    if (theme === 'oscuro') {

      moon.classList.add('d-none');
      sun.classList.remove('d-none');

    } else {

      moon.classList.remove('d-none');
      sun.classList.add('d-none');
    }

  }

});