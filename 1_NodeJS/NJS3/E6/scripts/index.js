/* =====================================================
   index.js
   Lógica principal del formulario de registro.
   —— La lógica de captura de datos NO fue modificada ——
   Se agregaron únicamente:
     1. Validación visual de Bootstrap (clase .was-validated)
     2. Render mejorado del resultado (con íconos y filas)
     3. Ocultamiento del placeholder vacío al mostrar datos
     4. Botón "volver arriba" (scroll)
   ===================================================== */

/* ── 1. BOTÓN VOLVER ARRIBA ── */
const btnSubir = document.getElementById('btnSubir');

// Mostrar/ocultar según posición del scroll
window.addEventListener('scroll', () => {
  if (window.scrollY > 200) {
    btnSubir.classList.add('visible');
  } else {
    btnSubir.classList.remove('visible');
  }
});

// Scroll suave al hacer click
btnSubir.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});


/* ── 2. SUBMIT DEL FORMULARIO ── */
// (lógica de captura de datos idéntica al original)
document.getElementById('formulario').addEventListener('submit', function(e) {
  e.preventDefault();

  // Activar validación visual de Bootstrap
  this.classList.add('was-validated');

  // Si el formulario no es válido, detener
  if (!this.checkValidity()) return;

  /* --- Captura de datos (sin cambios) --- */
  const nombre   = document.getElementById('nombre').value;
  const apellido = document.getElementById('apellido').value;
  const email    = document.getElementById('email').value;
  const edad     = document.getElementById('edad').value;

  const genero = document.querySelector('input[name="genero"]:checked')?.value || '—';

  const pais = document.getElementById('pais').value;

  const intereses = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
    .map(i => i.value)
    .join(', ') || '—';

  /* --- Render mejorado del resultado --- */
  // Se mantiene el innerHTML en #resultado igual que el original,
  // pero con estructura visual enriquecida (íconos + filas).
  document.getElementById('resultado-vacio').style.display = 'none'; // ocultar placeholder

  document.getElementById('resultado').innerHTML = `
    <div class="dato-fila">
      <div class="dato-icono"><i class="bi bi-person"></i></div>
      <div>
        <div class="dato-label">Nombre</div>
        <div class="dato-valor">${nombre}</div>
      </div>
    </div>

    <div class="dato-fila">
      <div class="dato-icono"><i class="bi bi-person-badge"></i></div>
      <div>
        <div class="dato-label">Apellido</div>
        <div class="dato-valor">${apellido}</div>
      </div>
    </div>

    <div class="dato-fila">
      <div class="dato-icono"><i class="bi bi-envelope"></i></div>
      <div>
        <div class="dato-label">Email</div>
        <div class="dato-valor">${email}</div>
      </div>
    </div>

    <div class="dato-fila">
      <div class="dato-icono"><i class="bi bi-calendar3"></i></div>
      <div>
        <div class="dato-label">Edad</div>
        <div class="dato-valor">${edad} años</div>
      </div>
    </div>

    <div class="dato-fila">
      <div class="dato-icono"><i class="bi bi-gender-ambiguous"></i></div>
      <div>
        <div class="dato-label">Género</div>
        <div class="dato-valor">${genero}</div>
      </div>
    </div>

    <div class="dato-fila">
      <div class="dato-icono"><i class="bi bi-globe-americas"></i></div>
      <div>
        <div class="dato-label">País</div>
        <div class="dato-valor">${pais}</div>
      </div>
    </div>

    <div class="dato-fila">
      <div class="dato-icono"><i class="bi bi-stars"></i></div>
      <div>
        <div class="dato-label">Intereses</div>
        <div class="dato-valor">${intereses}</div>
      </div>
    </div>
  `;
});