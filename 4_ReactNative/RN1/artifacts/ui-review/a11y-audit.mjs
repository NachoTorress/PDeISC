import { writeFile } from 'node:fs/promises';
import { BrowserDriver } from './browser-driver.mjs';

const contrastExpression = `(() => {
  const parse = (value) => {
    const matches = value.match(/[\\d.]+/g)?.map(Number) || [];
    return matches.length >= 3 ? [matches[0], matches[1], matches[2], matches[3] ?? 1] : [0, 0, 0, 0];
  };
  const over = (foreground, background) => foreground.slice(0, 3).map((channel, index) => foreground[3] * channel + (1 - foreground[3]) * background[index]).concat(1);
  const luminance = (color) => color.slice(0, 3).map((channel) => { const normalized = channel / 255; return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4; }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const effectiveBackground = (element) => {
    const backgrounds = [];
    for (let parent = element; parent; parent = parent.parentElement) backgrounds.unshift(parse(getComputedStyle(parent).backgroundColor));
    return backgrounds.reduce((background, foreground) => over(foreground, background), [255, 255, 255, 1]);
  };
  const checks = [];
  for (const element of document.querySelectorAll('*')) {
    const box = element.getBoundingClientRect();
    if (!box.width || !box.height || element.closest('[aria-disabled="true"],:disabled')) continue;
    const style = getComputedStyle(element);
    if (/FontAwesome/i.test(style.fontFamily) || style.visibility === 'hidden') continue;
    const ownText = [...element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent).join('').trim();
    if (!ownText && element.tagName !== 'INPUT') continue;
    const placeholder = element.tagName === 'INPUT' && !element.value && element.placeholder;
    const colorString = placeholder ? getComputedStyle(element, '::placeholder').color : style.color;
    const background = effectiveBackground(element);
    const foreground = over(parse(colorString), background);
    const lightness = [luminance(foreground), luminance(background)].sort((left, right) => left - right);
    const ratio = (lightness[1] + 0.05) / (lightness[0] + 0.05);
    const size = parseFloat(style.fontSize);
    const weight = Number(style.fontWeight) || 400;
    const minimum = size >= 24 || size >= 18.66 && weight >= 700 ? 3 : 4.5;
    checks.push({ text: String(placeholder || ownText || element.getAttribute('aria-label')).slice(0, 100), color: colorString, background: background.slice(0, 3).map(Math.round), size, weight, ratio: Math.round(ratio * 100) / 100, minimum, result: ratio >= minimum ? 'pass' : 'fail' });
  }
  return checks;
})()`;

export async function auditContrast(browser) {
  return browser.evaluate(contrastExpression);
}

const browser = await BrowserDriver.connect();
const report = { pages: [], keyboard: [], loading: null, providerNavigations: [], longIdentity: null };
try {
  await browser.viewport(1440, 900);
  await browser.open();
  await browser.reset();
  for (const [route, button] of [['login', null], ['register', 'Crear una cuenta'], ['verify', 'Verificar cuenta'], ['reset', 'Recuperar contraseña'], ['activate', 'Activar contraseña']]) {
    if (button) await browser.click(button);
    for (const mode of ['light', 'dark']) {
      if (mode === 'dark') await browser.click('Activar modo oscuro');
      report.pages.push({ route, mode, contrast: await auditContrast(browser) });
    }
    await browser.click('Activar modo claro');
    if (route !== 'login') await browser.click('Volver al ingreso');
  }
  await browser.reset();
  await browser.evaluate(`document.activeElement?.blur()`);
  for (let step = 0; step < 8; step += 1) {
    await browser.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await browser.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    report.keyboard.push(await browser.evaluate(`(() => { const element = document.activeElement; const style = getComputedStyle(element); return { tag: element.tagName, label: element.getAttribute('aria-label') || element.innerText, focusVisible: element.matches(':focus-visible'), outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, outlineColor: style.outlineColor }; })()`));
    if (step === 0) await browser.screenshot('after-keyboard-focus-1440');
  }
  await browser.fill('Correo electrónico', 'demo@example.test');
  await browser.fill('Contraseña', 'DemoPassword123!');
  await browser.evaluate(`window.__qaDelay = 1800`);
  await browser.click('Ingresar');
  report.loading = await browser.evaluate(`({ busy: Boolean(document.querySelector('[aria-busy="true"]')), text: document.body.innerText.includes('Un momento'), disabledProviders: [...document.querySelectorAll('[aria-label^="Ingresar con"]')].map((element) => element.getAttribute('aria-disabled')) })`);
  await browser.screenshot('after-login-1440-loading');
  await browser.waitFor(`!document.querySelector('input')`, 'bienvenida con login demorado');
  for (const mode of ['light', 'dark']) {
    if (mode === 'dark') await browser.click('Activar modo oscuro');
    report.pages.push({ route: 'welcome', mode, contrast: await auditContrast(browser) });
  }
  await browser.reset();
  for (const provider of ['Google', 'Discord', 'GitHub']) {
    await browser.click('Ingresar con ' + provider);
    await browser.waitFor(`document.body.innerText.includes('Iniciá sesión')`, 'app conservada al interceptar OAuth');
    await browser.screenshot('after-provider-' + provider.toLowerCase() + '-intercepted');
    await browser.reset();
  }
  report.providerNavigations = browser.providerNavigations;
} finally {
  await browser.close();
}

const longBrowser = await BrowserDriver.connect({ user: { displayName: 'María de los Ángeles Fernández de la Sierra', email: 'maria.delosangeles.fernandez.apellido.muy.extenso@example.test' } });
try {
  await longBrowser.viewport(375, 812);
  await longBrowser.open();
  await longBrowser.reset();
  await longBrowser.fill('Correo electrónico', 'demo@example.test');
  await longBrowser.fill('Contraseña', 'DemoPassword123!');
  await longBrowser.click('Ingresar');
  await longBrowser.waitFor(`!document.querySelector('input')`, 'bienvenida con identidad larga');
  report.longIdentity = await longBrowser.inspect();
  await longBrowser.screenshot('after-welcome-375-long-identity');
  await longBrowser.scroll('bottom');
  await longBrowser.screenshot('after-welcome-375-long-identity-bottom');
} finally {
  await longBrowser.close();
}

await writeFile(new URL('./a11y-report.json', import.meta.url), JSON.stringify(report, null, 2));
process.stdout.write(JSON.stringify({ contrastFailures: report.pages.flatMap((page) => page.contrast.filter((check) => check.result === 'fail').map((check) => ({ route: page.route, mode: page.mode, ...check }))), keyboard: report.keyboard, loading: report.loading, providerNavigations: report.providerNavigations, longIdentityOverflow: report.longIdentity.horizontalOverflow }) + '\n');
