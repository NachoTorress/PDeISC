/**
 * scripts/adminMain.js
 * -------------------------------------------------------
 * De donde viene: es el <script type="module"> cargado desde
 *                  pages/admin.html.
 * A donde va:     orquesta scripts/adminAuth.js,
 *                  scripts/adminWords.js, scripts/adminScores.js,
 *                  scripts/api.js y scripts/theme.js para armar
 *                  toda la pantalla de administracion.
 * -------------------------------------------------------
 */

import { consultarSesion, obtenerPalabrasAdmin, obtenerTablaPosiciones, obtenerLogsDescargas, obtenerLogsLogins } from './api.js';
import { inicializarLogin, inicializarLogout } from './adminAuth.js';
import { inicializarFormularioNuevaPalabra, renderizarPalabrasAdmin } from './adminWords.js';
import { renderizarScoresAdmin } from './adminScores.js';
import { renderizarLogsDescargas, renderizarLogsLogins } from './adminLogs.js';
import { inicializarTema } from './theme.js';

// ---- Referencias al DOM ----
const elPantallaLogin = document.getElementById('pantalla-login');
const elPantallaAdmin = document.getElementById('pantalla-admin');
const elUsuarioActual = document.getElementById('usuario-actual');
const elBotonLogout = document.getElementById('btn-logout');
const elBotonSubirArriba = document.getElementById('btn-subir-arriba');

const elListaPalabras = document.getElementById('lista-palabras-admin');
const elListaScores = document.getElementById('lista-scores-admin');
const elListaLogsDescargas = document.getElementById('lista-logs-descargas');
const elListaLogsLogins = document.getElementById('lista-logs-logins');
const elBloqueUsuario = document.getElementById('bloque-usuario');

/**
 * Muestra la pantalla de administracion (oculta el login) y carga los datos.
 * @param {string} usuario
 */
async function mostrarPanelAdmin(usuario) {
    elPantallaLogin.classList.add('d-none');
    elPantallaAdmin.classList.remove('d-none');
    elUsuarioActual.textContent = usuario;
    elBloqueUsuario.classList.remove('d-none');
    elBloqueUsuario.classList.add('d-flex');
    await Promise.all([cargarPalabras(), cargarScores(), cargarLogsDescargas(), cargarLogsLogins()]);
}

/**
 * Vuelve a mostrar la pantalla de login (por ejemplo, tras hacer logout).
 */
function mostrarPantallaLogin() {
    elPantallaAdmin.classList.add('d-none');
    elPantallaLogin.classList.remove('d-none');
    elBloqueUsuario.classList.add('d-none');
    elBloqueUsuario.classList.remove('d-flex');
}

/**
 * Trae el banco de palabras y lo pinta en pantalla.
 */
async function cargarPalabras() {
    try {
        const palabras = await obtenerPalabrasAdmin();
        renderizarPalabrasAdmin(elListaPalabras, palabras, cargarPalabras);
    } catch (error) {
        elListaPalabras.innerHTML = `<div class="alert alert-fallo">${error.message}</div>`;
    }
}

/**
 * Trae la tabla de puntajes y la pinta en pantalla (version editable).
 */
async function cargarScores() {
    try {
        const scores = await obtenerTablaPosiciones();
        renderizarScoresAdmin(elListaScores, scores, cargarScores);
    } catch (error) {
        elListaScores.innerHTML = `<div class="alert alert-fallo">${error.message}</div>`;
    }
}

/**
 * Trae el historial de descargas de PDF y lo pinta en pantalla.
 */
async function cargarLogsDescargas() {
    try {
        const logs = await obtenerLogsDescargas();
        renderizarLogsDescargas(elListaLogsDescargas, logs);
    } catch (error) {
        elListaLogsDescargas.innerHTML = `<div class="alert alert-fallo">${error.message}</div>`;
    }
}

/**
 * Trae el historial de logins del admin y lo pinta en pantalla.
 */
async function cargarLogsLogins() {
    try {
        const logs = await obtenerLogsLogins();
        renderizarLogsLogins(elListaLogsLogins, logs);
    } catch (error) {
        elListaLogsLogins.innerHTML = `<div class="alert alert-fallo">${error.message}</div>`;
    }
}

// ---- Login ----
inicializarLogin(
    {
        form: document.getElementById('form-login'),
        inputUsuario: document.getElementById('input-usuario'),
        inputContrasena: document.getElementById('input-contrasena'),
        errorUsuario: document.getElementById('error-usuario'),
        errorGeneral: document.getElementById('error-login-general'),
        botonIngresar: document.getElementById('btn-ingresar'),
        enlaceOlvide: document.getElementById('enlace-olvide-password'),
        contenedorOlvide: document.getElementById('mensaje-olvide-password'),
    },
    mostrarPanelAdmin
);

// ---- Logout ----
inicializarLogout(elBotonLogout, mostrarPantallaLogin);

// ---- Formulario para agregar palabra nueva ----
inicializarFormularioNuevaPalabra(
    {
        form: document.getElementById('form-nueva-palabra'),
        inputPalabra: document.getElementById('input-nueva-palabra'),
        inputCategoria: document.getElementById('input-nueva-categoria'),
        inputPista: document.getElementById('input-nueva-pista'),
        errorPalabra: document.getElementById('error-nueva-palabra'),
        errorCategoria: document.getElementById('error-nueva-categoria'),
        errorPista: document.getElementById('error-nueva-pista'),
        botonCrear: document.getElementById('btn-crear-palabra'),
    },
    cargarPalabras
);

// ---- Boton "subir arriba" ----
window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
        elBotonSubirArriba.classList.add('visible');
    } else {
        elBotonSubirArriba.classList.remove('visible');
    }
});
elBotonSubirArriba.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ---- Inicializacion: chequea si ya hay una sesion activa ----
async function inicializar() {
    inicializarTema();
    try {
        const { autenticado, usuario } = await consultarSesion();
        if (autenticado) {
            await mostrarPanelAdmin(usuario);
        } else {
            mostrarPantallaLogin();
        }
    } catch (error) {
        mostrarPantallaLogin();
    }
}

inicializar();
