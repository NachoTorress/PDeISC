const btnAgregar = document.getElementById('btnAgregar');
const inputNombre = document.getElementById('inputNombre');
const inputLink = document.getElementById('inputLink');
const listaNodos = document.getElementById('listaNodos');
const consola = document.getElementById('consola');
const logContenido = document.getElementById('logContenido');

btnAgregar.onclick = () => {
    const nombreVal = inputNombre.value.trim() || "Enlace Nuevo";
    const urlVal = inputLink.value.trim() || "https://google.com";

    const fila = document.createElement('div');
    fila.className = "fila-nodo p-3 rounded shadow-sm animate__animated animate__fadeIn";

    fila.innerHTML = `
        <div class="row g-2 align-items-center">
            <div class="col-12 col-lg-3">
                <small class="d-block text-secondary mb-1">Enlace activo:</small>
                <a href="${urlVal}" target="_blank" class="enlace-dinamico btn btn-link text-info fw-bold d-block text-truncate text-start p-0 text-decoration-none">
                    ${nombreVal}
                </a>
            </div>
            
            <div class="col-6 col-lg-3">
                <small class="d-block text-secondary mb-1">Cambiar nombre:</small>
                <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary edit-nombre" value="${nombreVal}">
            </div>
            
            <div class="col-6 col-lg-4">
                <small class="d-block text-secondary mb-1">Cambiar atributo href:</small>
                <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary edit-link" value="${urlVal}">
            </div>
            
            <div class="col-12 col-lg-2 d-flex align-items-end">
                <button class="btn btn-sm btn-warning w-100 btn-aplicar mt-auto">ACTUALIZAR</button>
            </div>
        </div>
    `;

    const a = fila.querySelector('.enlace-dinamico');
    const inputNom = fila.querySelector('.edit-nombre');
    const inputLnk = fila.querySelector('.edit-link');
    const btnApp = fila.querySelector('.btn-aplicar');

    btnApp.onclick = () => {
        const viejoNombre = a.textContent.trim();
        const viejoLink = a.getAttribute('href');
        
        const nuevoNombre = inputNom.value.trim();
        const nuevoLink = inputLnk.value.trim();

        // Aplicar cambios
        a.textContent = nuevoNombre;
        a.setAttribute('href', nuevoLink);

        registrarCambio(`MOD: [${viejoNombre}] -> [${nuevoNombre}] | URL: [${viejoLink}] -> [${nuevoLink}]`);
        
        // Animación de feedback
        btnApp.classList.replace('btn-warning', 'btn-success');
        btnApp.textContent = "¡LISTO!";
        setTimeout(() => {
            btnApp.classList.replace('btn-success', 'btn-warning');
            btnApp.textContent = "ACTUALIZAR";
        }, 800);
    };

    listaNodos.appendChild(fila);
    registrarCambio(`SISTEMA: Nuevo nodo &lt;a&gt; inyectado en el DOM.`);
    
    inputNombre.value = "";
    inputLink.value = "";
    inputNombre.focus();
};

function registrarCambio(mensaje) {
    consola.classList.remove('d-none');
    const item = document.createElement('div');
    item.innerHTML = `> [${new Date().toLocaleTimeString()}] ${mensaje}`;
    logContenido.appendChild(item);
    consola.scrollTop = consola.scrollHeight;
}