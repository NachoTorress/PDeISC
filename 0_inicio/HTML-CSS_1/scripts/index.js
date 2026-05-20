document.addEventListener('DOMContentLoaded', () => {

  // ══════════════ VARIABLES Y SELECTORES DEL TEMA ══════════════
  const themeStylesheet = document.getElementById('theme-stylesheet');
  const btnThemeDesktop = document.getElementById('btn-theme-desktop');
  const btnThemeMobile = document.getElementById('btn-theme-mobile');
  
  // Definimos las rutas exactas a tus archivos CSS independientes
  const URL_CLARO = "../css/claro.css";
  const URL_OSCURO = "../css/oscuro.css";

  // Verificar si hay una preferencia guardada de antes, sino por defecto 'claro'
  const savedTheme = localStorage.getItem('theme-file') || 'claro';
  applyThemeFile(savedTheme);

  // Escuchadores de clics
  if (btnThemeDesktop) btnThemeDesktop.addEventListener('click', toggleThemeFile);
  if (btnThemeMobile) btnThemeMobile.addEventListener('click', toggleThemeFile);

  function toggleThemeFile() {
    // Al mirar qué archivo está cargado deducimos el estado actual
    const isDark = themeStylesheet.getAttribute('href') === URL_OSCURO;
    const targetTheme = isDark ? 'claro' : 'oscuro';
    applyThemeFile(targetTheme);
  }

  function applyThemeFile(theme) {
    if (theme === 'oscuro') {
      themeStylesheet.setAttribute('href', URL_OSCURO);
      localStorage.setItem('theme-file', 'oscuro');
      actualizarIconosBotones('oscuro');
    } else {
      themeStylesheet.setAttribute('href', URL_CLARO);
      localStorage.setItem('theme-file', 'claro');
      actualizarIconosBotones('claro');
    }
  }

  function actualizarIconosBotones(theme) {
    // Intercambiar íconos Sol/Luna en Desktop
    if (btnThemeDesktop) {
      const sunIcon = btnThemeDesktop.querySelector('.theme-icon-light');
      const moonIcon = btnThemeDesktop.querySelector('.theme-icon-dark');
      if (theme === 'oscuro') {
        sunIcon.classList.remove('d-none');
        moonIcon.classList.add('d-none');
      } else {
        sunIcon.classList.add('d-none');
        moonIcon.classList.remove('d-none');
      }
    }

    // Intercambiar los textos/iconos en el Offcanvas Mobile
    if (btnThemeMobile) {
      const toggles = btnThemeMobile.querySelectorAll('.theme-text-toggle');
      if (theme === 'oscuro') {
        toggles[0].classList.add('d-none'); // Oculta "Modo Oscuro"
        toggles[1].classList.remove('d-none'); // Muestra "Modo Claro"
      } else {
        toggles[0].classList.remove('d-none');
        toggles[1].classList.add('d-none');
      }
    }
  }


  // ══════════════ LÓGICA DE SCROLL ORIGINAL ══════════════
  /* Cuando se toca un link del offcanvas:
     1. Se cierra el panel
     2. Al terminar la animación de cierre, se scrollea a la sección
     Sin este orden, el offcanvas bloquea el scroll y no llega al destino. */
  document.querySelectorAll('#menuSecciones a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = this.getAttribute('href');
      const offcanvasEl = document.getElementById('menuSecciones');
      const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
      if (offcanvas) {
        offcanvasEl.addEventListener('hidden.bs.offcanvas', function handler() {
          document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
          offcanvasEl.removeEventListener('hidden.bs.offcanvas', handler);
        });
        offcanvas.hide();
      }
    });
  });

});