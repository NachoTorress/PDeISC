import { writeFile } from 'node:fs/promises';
import { BrowserDriver } from './browser-driver.mjs';

const browser = await BrowserDriver.connect();
const checks = [];
const assert = (condition, description) => {
  if (!condition) throw new Error(description);
  checks.push({ description, result: 'pass' });
};
const text = () => browser.evaluate(`document.body.innerText`);
const inputType = (label) => browser.evaluate(`[...document.querySelectorAll('input')].find(element => element.getAttribute('aria-label') === ${JSON.stringify(label)})?.type`);

async function completePasswordForm({ code = true } = {}) {
  await browser.fill('Correo electrónico', 'demo@example.test');
  if (code) await browser.fill('Código de seis dígitos', '123456');
  await browser.fill('Nueva contraseña', 'DemoPassword123!');
  await browser.fill('Repetí la contraseña', 'DemoPassword123!');
  await browser.fill('Respuesta 1', 'Mascota demo');
  await browser.fill('Respuesta 2', 'Ciudad demo');
}

async function logout() {
  await browser.click('Cerrar sesión');
  assert((await text()).includes('¿Estás seguro'), 'Cerrar sesión solicita confirmación');
  await browser.click('Cancelar');
  assert(await browser.evaluate(`sessionStorage.getItem('acceso-session') !== null`), 'Cancelar conserva la sesión demo');
  await browser.click('Cerrar sesión');
  await browser.click('Sí, cerrar sesión');
  await browser.waitFor(`document.querySelector('input') !== null`, 'login después de cerrar sesión');
  assert(await browser.evaluate(`sessionStorage.getItem('acceso-session') === null`), 'Confirmar cierre elimina la sesión demo');
}

try {
  await browser.viewport(375, 812);
  await browser.open();
  await browser.reset();
  assert(await browser.evaluate(`[...document.querySelectorAll('[role="button"],button')].find(element => (element.getAttribute('aria-label') || element.innerText).trim() === 'Ingresar')?.getAttribute('aria-disabled') === 'true'`), 'Login vacío permanece desactivado');
  await browser.fill('Correo electrónico', 'correo-invalido');
  await browser.evaluate(`(() => { const input = document.querySelector('input'); input.focus(); input.blur(); })()`);
  await browser.waitFor(`document.querySelector('[role="alert"]') !== null`, 'validación del correo');
  assert((await text()).includes('correo válido'), 'Correo inválido muestra mensaje accesible');
  await browser.fill('Contraseña', 'DemoPassword123!');
  assert(await inputType('Contraseña') === 'password', 'Contraseña está oculta al inicio');
  await browser.click('Mostrar contraseña');
  assert(await inputType('Contraseña') === 'text', 'Mostrar contraseña permite revisar el valor');
  await browser.click('Ocultar contraseña');
  assert(await inputType('Contraseña') === 'password', 'Ocultar contraseña restablece campo seguro');
  await browser.fill('Correo electrónico', 'demo@example.test');
  await browser.evaluate(`window.__qaResponseOverride = { endpoint: '/login', status: 401, error: 'Credenciales de prueba incorrectas.' }`);
  await browser.click('Ingresar');
  await browser.waitFor(`document.body.innerText.includes('Credenciales de prueba incorrectas.')`, 'error mock del servidor');
  assert((await text()).includes('Credenciales de prueba incorrectas.'), 'Error de API se presenta al usuario');
  await browser.screenshot('after-login-375-error');
  await browser.evaluate(`delete window.__qaResponseOverride`);
  await browser.click('Ingresar');
  await browser.waitFor(`!document.querySelector('input')`, 'bienvenida después de login');
  assert((await text()).includes('Martina Pérez'), 'Login con API mock muestra bienvenida y nombre');
  await logout();

  await browser.click('Crear una cuenta');
  await completePasswordForm({ code: false });
  await browser.fill('Nombre y apellido', 'Martina Pérez');
  const unavailable = await browser.evaluate(`[...document.querySelectorAll('[role="button"],button')].find(element => element.getAttribute('aria-label') === 'Pregunta 1: Ciudad donde naciste')?.getAttribute('aria-disabled')`);
  assert(unavailable === 'true', 'Pregunta usada en otra respuesta está desactivada');
  await browser.click('Pregunta 1: Nombre de tu escuela primaria');
  assert(await browser.evaluate(`[...document.querySelectorAll('[role="button"],button')].find(element => element.getAttribute('aria-label') === 'Pregunta 1: Nombre de tu escuela primaria')?.getAttribute('aria-pressed') === 'true'`), 'Cambiar pregunta actualiza selección accesible');
  await browser.click('Crear cuenta');
  await browser.waitFor(`document.body.innerText.includes('Verificá tu correo')`, 'verificación después de registro');
  assert((await text()).includes('Te enviamos un código'), 'Registro conserva mensaje y navega a verificación');
  await browser.click('Enviar otro código');
  assert(await browser.evaluate(`window.__qaMockCalls.includes('/request-code')`), 'Reenvío de código pasa por API mock');
  await browser.fill('Código de seis dígitos', '12a34567');
  assert(await browser.evaluate(`[...document.querySelectorAll('input')].find(element => element.getAttribute('aria-label') === 'Código de seis dígitos').value === '123456'`), 'Código elimina letras y limita a seis dígitos');
  await browser.click('Verificar e ingresar');
  await browser.waitFor(`!document.querySelector('input')`, 'bienvenida después de verificar');
  assert(await browser.evaluate(`window.__qaMockCalls.includes('/verify-email')`), 'Verificación inicia sesión mediante API mock');
  await logout();

  await browser.click('Recuperar contraseña');
  await browser.fill('Correo electrónico', 'demo@example.test');
  await browser.click('Enviar código');
  await completePasswordForm();
  await browser.click('Guardar contraseña');
  await browser.waitFor(`document.body.innerText.includes('Iniciá sesión')`, 'login después de recuperar contraseña');
  assert((await text()).includes('Guardamos tu nueva contraseña'), 'Recuperación devuelve al login con confirmación');

  await browser.click('Activar contraseña');
  await browser.fill('Correo electrónico', 'demo@example.test');
  await browser.click('Enviar código');
  await completePasswordForm();
  await browser.click('Activar e ingresar');
  await browser.waitFor(`!document.querySelector('input')`, 'bienvenida después de activar');
  assert(await browser.evaluate(`window.__qaMockCalls.includes('/activate-local')`), 'Activación termina en bienvenida con sesión demo');
  await browser.reset();
  await browser.evaluate(`document.activeElement?.blur()`);
  await browser.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await browser.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  assert(await browser.evaluate(`document.activeElement !== document.body`), 'Tab mueve el foco a un control interactivo');
  assert(browser.errors.length === 0, 'Interacciones completan sin errores JavaScript de consola');
  assert(browser.remoteBlocked === 0, 'No se emitieron solicitudes de red externas');
  await writeFile(new URL('./interaction-report.json', import.meta.url), JSON.stringify({ checks, consoleErrors: browser.errors, remoteBlocked: browser.remoteBlocked }, null, 2));
  process.stdout.write(JSON.stringify({ checks: checks.length, result: 'pass' }) + '\n');
} finally {
  await browser.close();
}
