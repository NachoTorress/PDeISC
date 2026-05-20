document.addEventListener('DOMContentLoaded', () => {

  // ═══════════════════════════════
  // TEMA
  // ═══════════════════════════════

  const themeStylesheet = document.getElementById('theme-stylesheet');
  const btnTheme = document.getElementById('btn-theme');

  const URL_CLARO = '../css/articulo.css';
  const URL_OSCURO = '../css/articulo_dark.css';

  const savedTheme =
    localStorage.getItem('theme-file') || 'claro';

  applyTheme(savedTheme);

  btnTheme.addEventListener('click', toggleTheme);

  function toggleTheme() {

    const isDark =
      themeStylesheet.getAttribute('href') === URL_OSCURO;

    applyTheme(isDark ? 'claro' : 'oscuro');

  }

  function applyTheme(theme) {

    const sun =
      btnTheme.querySelector('.theme-icon-light');

    const moon =
      btnTheme.querySelector('.theme-icon-dark');

    if (theme === 'oscuro') {

      themeStylesheet.setAttribute('href', URL_OSCURO);

      localStorage.setItem('theme-file', 'oscuro');

      sun.classList.remove('d-none');
      moon.classList.add('d-none');

    } else {

      themeStylesheet.setAttribute('href', URL_CLARO);

      localStorage.setItem('theme-file', 'claro');

      sun.classList.add('d-none');
      moon.classList.remove('d-none');

    }

  }

  // ═══════════════════════════════
  // OTRO ASUNTO
  // ═══════════════════════════════

  const asunto =
    document.getElementById('asunto');

  const otroContainer =
    document.getElementById('otro-asunto-container');

  const otroInput =
    document.getElementById('otroAsunto');

  asunto.addEventListener('change', () => {

    if (asunto.value === 'otro') {

      otroContainer.classList.remove('d-none');

      otroInput.required = true;

    } else {

      otroContainer.classList.add('d-none');

      otroInput.required = false;

      otroInput.value = '';

    }

  });

  // ═══════════════════════════════
  // VALIDACIONES
  // ═══════════════════════════════

  const form =
    document.getElementById('formContacto');

  const nombre =
    document.getElementById('nombre');

  const email =
    document.getElementById('email');

  const soloLetras =
    /^[a-zA-ZÀ-ÖØ-öø-ÿ\s\-']+$/;

  const formatoEmail =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validarNombre() {

    const val = nombre.value.trim();

    if (
      val.length < 3 ||
      !soloLetras.test(val)
    ) {

      nombre.setCustomValidity('invalido');

    } else {

      nombre.setCustomValidity('');

    }

  }

  function validarEmail() {

    const val = email.value.trim();

    if (!formatoEmail.test(val)) {

      email.setCustomValidity('invalido');

    } else {

      email.setCustomValidity('');

    }

  }

  nombre.addEventListener('input', validarNombre);

  email.addEventListener('input', validarEmail);

  form.addEventListener('submit', event => {

    validarNombre();
    validarEmail();

    if (!form.checkValidity()) {

      event.preventDefault();
      event.stopPropagation();

    }

    form.classList.add('was-validated');

  });

});