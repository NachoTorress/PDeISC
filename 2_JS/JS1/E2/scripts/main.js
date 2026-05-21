// --- MODO OSCURO / CLARO ─────────────────────────────────────

const themeToggle = document.getElementById('themeToggle');

// Función que ajusta el icono inicial del botón según el estado cargado
(function inicializarBotonTema() {
    const themeStylesheet = document.getElementById('themeStylesheet');
    if (themeStylesheet && themeStylesheet.href.includes('style-dark')) {
        themeToggle.textContent = '☀️';
    } else {
        themeToggle.textContent = '🌙';
    }
})();

function activarModoOscuro() {
    const themeStylesheet = document.getElementById('themeStylesheet');
    themeStylesheet.href = '../styles/style-dark.css';
    themeToggle.textContent = '☀️';
    localStorage.setItem('tema', 'oscuro');
}

function activarModoClaro() {
    const themeStylesheet = document.getElementById('themeStylesheet');
    themeStylesheet.href = '../styles/style.css';
    themeToggle.textContent = '🌙';
    localStorage.setItem('tema', 'claro');
}

themeToggle.addEventListener('click', () => {
    const themeStylesheet = document.getElementById('themeStylesheet');
    const esOscuro = themeStylesheet.href.includes('style-dark');

    esOscuro
        ? activarModoClaro()
        : activarModoOscuro();
});

// ============================================================
//  SISTEMA DE GESTIÓN DINÁMICA — Solo Memoria (Array)
// ============================================================

// El resto de tu código original (Referencias DOM, Validaciones, Submit, RenderTabla y Botón Top) se queda exactamente igual.

// ============================================================
//  SISTEMA DE GESTIÓN DINÁMICA — Solo Memoria (Array)
// ============================================================

// --- REFERENCIAS AL DOM ───────────────────────────────────────
const form           = document.getElementById('userForm');
const tabla          = document.getElementById('tablaUsuarios');
const alertContainer = document.getElementById('alertContainer');
const userBadge      = document.getElementById('userBadge');
const emptyMsg       = document.getElementById('emptyMsg');
const btnTop         = document.getElementById('btnTop');

// --- REGEX DE VALIDACIÓN ──────────────────────────────────────
const regexText = /^[a-zA-ZÁÉÍÓÚáéíóúñÑ\s']{3,}$/; 

// --- ESTADO DE LA APLICACIÓN ──────────────────────────────────
// Ahora es solo un array vacío que vive mientras no se refresque la pestaña
let usuarios = [];

// --- FUNCIONES DE INTERFAZ ────────────────────────────────────

const showAlert = (msg, type) => {
    alertContainer.innerHTML = `<div class="alert-custom alert-${type}">${msg}</div>`;
    setTimeout(() => alertContainer.innerHTML = '', 3500);
};

// --- VALIDACIÓN DINÁMICA ──────────────────────────────────────
document.querySelectorAll('.field-input').forEach(input => {
    input.addEventListener('input', () => {
        const id = input.id;
        const errorDiv = document.getElementById(`error-${id}`);
        let esValido = true;

        if (['nombre', 'apellidos', 'calle', 'ciudad'].includes(id)) {
            esValido = regexText.test(input.value);
        } else if (['altura', 'cp'].includes(id)) {
            esValido = input.value.length > 0 && Number(input.value) > 0;
        }

        // Opcionales
        if ((id === 'piso' || id === 'depto') && input.value === "") {
            esValido = true;
        }

        if (errorDiv) errorDiv.style.display = esValido ? 'none' : 'block';
        input.classList.toggle('input-error', !esValido);
    });
});

document.querySelectorAll('.input-no-e').forEach(input => {
    input.addEventListener('keydown', (e) => {
        if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
    });
});

// --- MANEJO DEL SUBMIT ────────────────────────────────────────
form.addEventListener('submit', (e) => {
    e.preventDefault(); 

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    const metodoStorage = data.metodo; // push o unshift
    
    let formValido = true;

    // Validación de campos obligatorios
    ['nombre', 'apellidos', 'calle', 'ciudad'].forEach(id => {
        if (!regexText.test(document.getElementById(id).value)) formValido = false;
    });

    ['altura', 'cp'].forEach(id => {
        const val = document.getElementById(id).value;
        if (!val || Number(val) < 1) formValido = false;
    });

    if (!formValido) {
        showAlert('⚠ Completa los campos obligatorios.', 'danger');
        return;
    }

    const nuevoUsuario = {
        id: Date.now(),
        nombre: data.nombre,
        apellidos: data.apellidos,
        calle: data.calle,
        altura: data.altura,
        piso: data.piso || '',
        depto: data.depto || '',
        ciudad: data.ciudad,
        cp: data.cp
    };

    // Uso de métodos de Array según el formulario
    if (metodoStorage === 'push') {
        usuarios.push(nuevoUsuario);
    } else {
        usuarios.unshift(nuevoUsuario);
    }

    renderTabla();
    form.reset();
    showAlert(`✓ Agregado al array usando ${metodoStorage}()`, 'success');
});

// --- RENDERIZADO DE TABLA ─────────────────────────────────────
function renderTabla() {
    tabla.innerHTML = '';
    
    userBadge.textContent = `${usuarios.length} ${usuarios.length === 1 ? 'Registro' : 'Registros'}`;
    emptyMsg.style.display = usuarios.length === 0 ? 'block' : 'none';

    usuarios.forEach(user => {
        const row = document.createElement('tr');
        row.className = 'row-animate';

        const pisoDpto = [
            user.piso ? `Piso ${user.piso}` : '',
            user.depto ? `Dpto ${user.depto}` : ''
        ].filter(Boolean).join(' · ');

        row.innerHTML = `
            <td>
                <div class="user-name">${user.apellidos}, ${user.nombre}</div>
            </td>
            <td>
                <div class="user-address">${user.calle} ${user.altura}</div>
                ${pisoDpto ? `<div class="user-meta">${pisoDpto}</div>` : ''}
            </td>
            <td>
                <div class="user-city">${user.ciudad}</div>
                <div class="user-meta">CP: ${user.cp}</div>
            </td>
            <td class="text-end">
                <button class="btn-delete" data-id="${user.id}">Eliminar</button>
            </td>
        `;
        
        tabla.appendChild(row);
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.onclick = () => {
            const id = Number(btn.dataset.id);
            usuarios = usuarios.filter(u => u.id !== id);
            renderTabla();
        };
    });
}

// --- BOTÓN VOLVER ARRIBA ──────────────────────────────────────
window.addEventListener('scroll', () => {
    btnTop.classList.toggle('visible', window.scrollY > 300);
});

btnTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});