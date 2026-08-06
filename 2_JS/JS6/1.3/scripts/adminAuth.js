/**
 * scripts/adminAuth.js
 * -------------------------------------------------------
 * De donde viene: scripts/adminMain.js conecta esta funcion
 *                  con el formulario de login de pages/admin.html.
 * A donde va:     usa scripts/api.js (iniciarSesion, cerrarSesion,
 *                  consultarSesion, pedirRecuperacionPassword)
 *                  que hablan con modules/routes/authRoutes.js.
 * Que hace:       valida el formulario en tiempo real, maneja el
 *                  login/logout y el mensaje de "olvide mi
 *                  contraseña" (que solo indica contactar al
 *                  administrador, sin resetear nada).
 * -------------------------------------------------------
 */

import { iniciarSesion, cerrarSesion, pedirRecuperacionPassword } from './api.js';
import { validarUsuarioCliente, conectarValidacionTiempoReal } from './validation.js';

/**
 * Conecta el formulario de login con la API y ejecuta un callback
 * cuando el login es exitoso.
 * @param {Object} refs referencias a los elementos del DOM
 * @param {(usuario: string) => void} alIniciarSesion
 */
export function inicializarLogin(refs, alIniciarSesion) {
    const { form, inputUsuario, inputContrasena, errorUsuario, errorGeneral, botonIngresar, enlaceOlvide, contenedorOlvide } = refs;

    const validarUsuario = conectarValidacionTiempoReal(inputUsuario, errorUsuario, validarUsuarioCliente);

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        errorGeneral.textContent = '';

        if (!validarUsuario()) return;
        if (inputContrasena.value.length === 0) {
            errorGeneral.textContent = 'Ingresa tu contraseña.';
            return;
        }

        botonIngresar.disabled = true;
        botonIngresar.textContent = 'Ingresando...';

        try {
            const resultado = await iniciarSesion({
                usuario: inputUsuario.value.trim(),
                contrasena: inputContrasena.value,
            });
            alIniciarSesion(resultado.usuario);
        } catch (error) {
            errorGeneral.textContent = error.message;
        } finally {
            botonIngresar.disabled = false;
            botonIngresar.textContent = 'Ingresar';
        }
    });

    enlaceOlvide.addEventListener('click', async (evento) => {
        evento.preventDefault();
        const { mensaje } = await pedirRecuperacionPassword();
        contenedorOlvide.textContent = mensaje;
        contenedorOlvide.classList.remove('d-none');
    });
}

/**
 * Conecta el boton de logout con la API.
 * @param {HTMLElement} botonLogout
 * @param {() => void} alCerrarSesion
 */
export function inicializarLogout(botonLogout, alCerrarSesion) {
    botonLogout.addEventListener('click', async () => {
        try {
            await cerrarSesion();
        } finally {
            alCerrarSesion();
        }
    });
}
