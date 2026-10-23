import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const artifactDirectory = path.dirname(fileURLToPath(import.meta.url));
const origin = 'http://127.0.0.1:8084';
const debugOrigin = 'http://127.0.0.1:9223';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class BrowserDriver {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.errors = [];
    this.remoteBlocked = 0;
    this.providerNavigations = [];
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        clearTimeout(pending.timeout);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
      } else if (message.method === 'Runtime.exceptionThrown') {
        this.errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
      } else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        this.errors.push(message.params.args.map((argument) => argument.value || argument.description).join(' '));
      } else if (message.method === 'Fetch.requestPaused') {
        const { requestId, request } = message.params;
        const provider = request.url.match(/\/auth\/oauth\/(google|discord|github)\/start/);
        if (provider) {
          this.providerNavigations.push(provider[1]);
          this.send('Fetch.fulfillRequest', { requestId, responseCode: 204, responseHeaders: [], body: '' }).catch(() => {});
          return;
        }
        const local = request.url.startsWith(origin) || /^(data|blob):/.test(request.url);
        if (!local) this.remoteBlocked += 1;
        this.send(local ? 'Fetch.continueRequest' : 'Fetch.failRequest', local ? { requestId } : { requestId, errorReason: 'BlockedByClient' }).catch(() => {});
      }
    });
  }

  static async connect({ user = {} } = {}) {
    const response = await fetch(`${debugOrigin}/json/new?about:blank`, { method: 'PUT' });
    if (!response.ok) throw new Error('No se pudo crear la pestaña de pruebas de Edge.');
    const target = await response.json();
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    const driver = new BrowserDriver(socket);
    driver.targetId = target.id;
    await driver.send('Page.enable');
    await driver.send('Runtime.enable');
    await driver.send('Network.enable');
    await driver.send('Network.setCacheDisabled', { cacheDisabled: true });
    await driver.send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
    await driver.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
    await driver.send('Page.addScriptToEvaluateOnNewDocument', { source: `
      (() => {
        const nativeFetch = window.fetch.bind(window);
        window.__qaMockCalls = [];
        const mockUser = { id: 'qa-user', email: 'demo@example.test', displayName: 'Martina Pérez', role: 'user', createdAt: '2026-10-22T12:00:00.000Z', linkedProviders: ['google', 'github'], ...${JSON.stringify(user)} };
        const session = { token: 'qa-browser-only-session', user: mockUser };
        window.fetch = async (resource, init = {}) => {
          const url = typeof resource === 'string' ? resource : resource.url;
          const parsed = new URL(url, location.href);
          if (parsed.pathname.includes('/auth/')) {
            const endpoint = parsed.pathname.slice(parsed.pathname.indexOf('/auth/') + 5);
            window.__qaMockCalls.push(endpoint);
            if (window.__qaDelay) await new Promise((resolve) => setTimeout(resolve, window.__qaDelay));
            if (window.__qaResponseOverride?.endpoint === endpoint) {
              return new Response(JSON.stringify({ error: window.__qaResponseOverride.error }), { status: window.__qaResponseOverride.status || 400, headers: { 'Content-Type': 'application/json' } });
            }
            const data = endpoint === '/me' ? { user: mockUser } :
              ['/login', '/verify-email', '/activate-local', '/oauth/redeem'].includes(endpoint) ? session :
              { message: endpoint === '/register' ? 'Te enviamos un código para verificar tu correo.' : endpoint === '/reset-password' ? 'Guardamos tu nueva contraseña. Ya podés ingresar.' : 'Te enviamos un código a tu correo.' };
            return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          if (parsed.origin !== location.origin) throw new Error('QA bloqueó una solicitud externa.');
          return nativeFetch(resource, init);
        };
      })();
    ` });
    return driver;
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 20000);
      this.pending.set(id, { resolve, reject, timeout });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const response = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
    return response.result.value;
  }

  async waitFor(expression, description, milliseconds = 10000) {
    const deadline = Date.now() + milliseconds;
    while (Date.now() < deadline) {
      if (await this.evaluate(expression)) return;
      await delay(100);
    }
    throw new Error(`No apareció: ${description}`);
  }

  async viewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  }

  async open() {
    await this.send('Page.navigate', { url: origin });
    await this.waitFor(`document.querySelector('[role="button"],button') !== null && document.body.innerText.includes('acceso')`, 'aplicación');
    await this.evaluate(`document.fonts.ready.then(() => true)`);
    await delay(150);
  }

  async reset() {
    await this.evaluate(`sessionStorage.clear()`);
    await this.open();
    await this.waitFor(`document.querySelector('input') !== null`, 'formulario de ingreso');
  }

  async click(label) {
    await this.evaluate(`(() => {
      const label = ${JSON.stringify(label)};
      const element = [...document.querySelectorAll('[role="button"],button')].find((item) => (item.getAttribute('aria-label') || item.innerText).replace(/[\uE000-\uF8FF]/g, '').replace(/\\s+/g, ' ').trim() === label);
      if (!element) throw new Error('Botón ausente: ' + label);
      if (element.getAttribute('aria-disabled') === 'true' || element.disabled) throw new Error('Botón desactivado: ' + label);
      element.click();
    })()`);
    await delay(120);
  }

  async fill(label, value) {
    await this.evaluate(`(() => {
      const element = [...document.querySelectorAll('input')].find((input) => input.getAttribute('aria-label') === ${JSON.stringify(label)});
      if (!element) throw new Error('Campo ausente: ' + ${JSON.stringify(label)});
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(element, ${JSON.stringify(value)});
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await delay(40);
  }

  async scroll(position = 'top') {
    await this.evaluate(`(() => {
      for (const element of document.querySelectorAll('*')) {
        if (element.scrollHeight > element.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(element).overflowY)) element.scrollTop = ${position === 'bottom' ? 'element.scrollHeight' : '0'};
      }
    })()`);
    await delay(100);
  }

  async screenshot(name) {
    await this.evaluate(`document.fonts.ready.then(() => true)`);
    await delay(100);
    const result = await this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const filename = path.join(artifactDirectory, `${name}.png`);
    await writeFile(filename, Buffer.from(result.data, 'base64'));
    return filename;
  }

  async inspect() {
    return this.evaluate(`(() => {
      const visible = (element) => { const box = element.getBoundingClientRect(); return box.width > 0 && box.height > 0; };
      return {
        viewport: { width: innerWidth, height: innerHeight },
        documentWidth: document.documentElement.scrollWidth,
        title: document.title,
        controls: [...document.querySelectorAll('[role="button"],button,input')].filter(visible).map((element) => {
          const box = element.getBoundingClientRect();
          return { label: element.getAttribute('aria-label') || element.innerText, width: Math.round(box.width), height: Math.round(box.height), disabled: element.getAttribute('aria-disabled') === 'true' || element.disabled === true };
        }),
        horizontalOverflow: [...document.querySelectorAll('input,[role="button"],button')].filter(visible).filter((element) => { const box = element.getBoundingClientRect(); return box.left < -1 || box.right > innerWidth + 1; }).map((element) => element.getAttribute('aria-label') || element.innerText),
        unnamedInputs: [...document.querySelectorAll('input')].filter(visible).filter((element) => !element.getAttribute('aria-label') && !element.labels?.length).length,
        unnamedButtons: [...document.querySelectorAll('[role="button"],button')].filter(visible).filter((element) => !(element.getAttribute('aria-label') || element.innerText).trim()).length,
        scrollRegions: [...document.querySelectorAll('*')].filter((element) => element.scrollHeight > element.clientHeight + 3 && /(auto|scroll)/.test(getComputedStyle(element).overflowY)).map((element) => ({ height: element.clientHeight, contentHeight: element.scrollHeight })),
        mockCalls: window.__qaMockCalls,
        text: document.body.innerText
      };
    })()`);
  }

  async close() {
    await fetch(`${debugOrigin}/json/close/${this.targetId}`).catch(() => {});
    if (this.socket.readyState !== WebSocket.CLOSED) {
      const closed = new Promise((resolve) => this.socket.addEventListener('close', resolve, { once: true }));
      this.socket.close();
      await Promise.race([closed, delay(1000)]);
    }
  }
}

export async function captureMatrix(prefix = 'after') {
  await mkdir(artifactDirectory, { recursive: true });
  const browser = await BrowserDriver.connect();
  const report = { screenshots: [], pages: [], interactions: [], consoleErrors: [], remoteBlocked: 0 };
  try {
    for (const [width, height] of [[1440, 900], [768, 1024], [375, 812]]) {
      await browser.viewport(width, height);
      await browser.open();
      await browser.reset();
      for (const [route, button] of [['login', null], ['register', 'Crear una cuenta'], ['verify', 'Verificar cuenta'], ['reset', 'Recuperar contraseña'], ['activate', 'Activar contraseña']]) {
        if (button) await browser.click(button);
        await browser.scroll();
        report.screenshots.push(await browser.screenshot(`${prefix}-${route}-${width}-light`));
        report.pages.push({ route, mode: 'light', ...await browser.inspect() });
        if (prefix !== 'before') {
          if (['register', 'reset', 'activate'].includes(route)) {
            await browser.scroll('bottom');
            report.screenshots.push(await browser.screenshot(`${prefix}-${route}-${width}-light-bottom`));
            await browser.scroll();
          }
          await browser.click('Activar modo oscuro');
          report.screenshots.push(await browser.screenshot(`${prefix}-${route}-${width}-dark`));
          report.pages.push({ route, mode: 'dark', ...await browser.inspect() });
          if (['register', 'reset', 'activate'].includes(route)) {
            await browser.scroll('bottom');
            report.screenshots.push(await browser.screenshot(`${prefix}-${route}-${width}-dark-bottom`));
            await browser.scroll();
          }
          await browser.click('Activar modo claro');
        }
        if (route !== 'login') await browser.click('Volver al ingreso');
      }
      await browser.click('Activar modo oscuro');
      await browser.scroll();
      if (prefix === 'before') {
        report.screenshots.push(await browser.screenshot(`${prefix}-login-${width}-dark`));
        report.pages.push({ route: 'login', mode: 'dark', ...await browser.inspect() });
      }
      await browser.fill('Correo electrónico', 'demo@example.test');
      await browser.fill('Contraseña', 'DemoPassword123!');
      await browser.click('Ingresar');
      await browser.waitFor(`!document.querySelector('input')`, 'bienvenida');
      await browser.scroll();
      report.screenshots.push(await browser.screenshot(`${prefix}-welcome-${width}-dark`));
      report.pages.push({ route: 'welcome', mode: 'dark', ...await browser.inspect() });
      await browser.click('Activar modo claro');
      report.screenshots.push(await browser.screenshot(`${prefix}-welcome-${width}-light`));
      report.pages.push({ route: 'welcome', mode: 'light', ...await browser.inspect() });
      report.interactions.push({ viewport: width, loginWithMockSession: 'pass', themeToggle: 'pass' });
    }
    report.consoleErrors = browser.errors;
    report.remoteBlocked = browser.remoteBlocked;
    await writeFile(path.join(artifactDirectory, `${prefix}-report.json`), JSON.stringify(report, null, 2));
    process.stdout.write(JSON.stringify({ screenshotCount: report.screenshots.length, pages: report.pages.length, consoleErrors: report.consoleErrors, remoteBlocked: report.remoteBlocked }) + '\n');
  } finally {
    await browser.close();
  }
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await captureMatrix(process.argv[2] || 'after');
}
