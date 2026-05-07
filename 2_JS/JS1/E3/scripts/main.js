const form = document.getElementById('personaForm');
const listaUI = document.getElementById('listaPersonas');
const alertContainer = document.getElementById('alertContainer');

const fechaNacInput = document.getElementById('fechaNac');
const edadInput = document.getElementById('edad');

const tieneHijosSelect = document.getElementById('tieneHijos');
const containerCantidadHijos = document.getElementById('containerCantidadHijos');
const cantHijosInput = document.getElementById('cantHijos');

const normalHeader = document.getElementById('normalHeader');
const confirmHeader = document.getElementById('confirmHeader');
const btnSolicitarBorrado = document.getElementById('btnSolicitarBorrado');
const btnConfirmarBorrado = document.getElementById('btnConfirmarBorrado');
const btnCancelarBorrado = document.getElementById('btnCancelarBorrado');

let db = JSON.parse(localStorage.getItem('db')) || [];

const regexTexto = /^[a-zA-ZÁÉÍÓÚáéíóúñÑ\s]{3,}$/;
const regexMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

document.addEventListener('DOMContentLoaded', renderizarLista);

//
// bloquear e + - . en number y tel
//
document.querySelectorAll('input[type="number"], input[type="tel"]').forEach(input => {
    input.addEventListener('keydown', (e) => {
        if (['e', 'E', '+', '-', '.'].includes(e.key)) {
            e.preventDefault();
        }
    });
});

//
// mostrar hijos
//
tieneHijosSelect.addEventListener('change', () => {
    if (tieneHijosSelect.value === "Si") {
        containerCantidadHijos.classList.remove('d-none');
    } else {
        containerCantidadHijos.classList.add('d-none');
        cantHijosInput.value = 0;
    }
});

//
// calcular edad + bloquear fecha futura
//
fechaNacInput.addEventListener('change', () => {
    const fecha = new Date(fechaNacInput.value);
    const hoy = new Date();

    hoy.setHours(0,0,0,0);
    fecha.setHours(0,0,0,0);

    if (fecha > hoy) {
        fechaNacInput.classList.add('is-invalid');
        fechaNacInput.nextElementSibling.innerText =
            "La fecha no puede ser posterior a hoy.";

        fechaNacInput.value = "";
        edadInput.value = "";
        return;
    }

    fechaNacInput.classList.remove('is-invalid');
    fechaNacInput.nextElementSibling.innerText = "";

    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mes = hoy.getMonth() - fecha.getMonth();

    if (
        mes < 0 ||
        (mes === 0 && hoy.getDate() < fecha.getDate())
    ) {
        edad--;
    }

    edadInput.value = edad >= 0 ? edad : "";
});

//
// quitar invalid
//
form.addEventListener('input', (e) => {
    if (
        e.target.classList.contains('form-control') ||
        e.target.classList.contains('form-select')
    ) {
        e.target.classList.remove('is-invalid');
    }
});

//
// submit
//
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const persona = Object.fromEntries(fd.entries());

    let esValido = true;

    if (!regexTexto.test(persona.nombre)) {
        document.getElementById('nombre').classList.add('is-invalid');
        esValido = false;
    }

    if (!regexTexto.test(persona.apellido)) {
        document.getElementById('apellido').classList.add('is-invalid');
        esValido = false;
    }

    if (!regexTexto.test(persona.nacionalidad)) {
        document.getElementById('nacionalidad').classList.add('is-invalid');
        esValido = false;
    }

    if (!regexMail.test(persona.mail)) {
        document.getElementById('mail').classList.add('is-invalid');
        esValido = false;
    }

    if (!persona.dni || persona.dni.length < 7) {
        document.getElementById('dni').classList.add('is-invalid');
        esValido = false;
    }

    if (!persona.tramite || persona.tramite.length < 6) {
        document.getElementById('tramite').classList.add('is-invalid');
        esValido = false;
    }

    if (!persona.fechaNac) {
        document.getElementById('fechaNac').classList.add('is-invalid');
        esValido = false;
    }

    if (
        persona.tieneHijos === "Si" &&
        (!persona.cantHijos || Number(persona.cantHijos) < 1)
    ) {
        cantHijosInput.classList.add('is-invalid');
        esValido = false;
    }

    if (!esValido) {
        showAlert("Error: Algunos datos son incorrectos.", "danger");
        return;
    }

    db.push(persona);
    localStorage.setItem("db", JSON.stringify(db));

    showAlert("Ciudadano registrado con éxito.", "success");

    renderizarLista();

    form.reset();
    edadInput.value = "";
    containerCantidadHijos.classList.add('d-none');
});

//
// render lista
//
function renderizarLista() {
    listaUI.innerHTML = "";

    db.forEach((p) => {
        const li = document.createElement("li");

        li.className =
            "list-group-item d-flex align-items-center p-3 animate-row";

        li.innerHTML = `
            <div>
                <h5 class="mb-0 fw-bold text-uppercase">
                    ${p.apellido} ${p.nombre}
                </h5>
            </div>
        `;

        listaUI.prepend(li);
    });
}

//
// borrado seguro SIN alert
//
btnSolicitarBorrado.addEventListener('click', () => {
    normalHeader.classList.add('d-none');
    confirmHeader.classList.remove('d-none');
});

btnCancelarBorrado.addEventListener('click', () => {
    confirmHeader.classList.add('d-none');
    normalHeader.classList.remove('d-none');
});

btnConfirmarBorrado.addEventListener('click', () => {
    localStorage.removeItem("db");
    db = [];

    renderizarLista();

    confirmHeader.classList.add('d-none');
    normalHeader.classList.remove('d-none');

    showAlert("Base de datos vaciada.", "info");
});

//
// alerta bootstrap
//
function showAlert(msg, type) {
    alertContainer.innerHTML = `
        <div class="alert alert-${type} fade show" role="alert">
            ${msg}
        </div>
    `;

    setTimeout(() => {
        alertContainer.innerHTML = "";
    }, 3000);
}