/** Regresión del visor TV. Requiere una exportación web local servida y Playwright.
 * PLAYWRIGHT_MODULE y BROWSER_EXECUTABLE permiten usar las herramientas del entorno.
 * Todas las respuestas de la API son ficticias; no consulta la base de producción.
 */
const fs = require("node:fs/promises");
const path = require("node:path");
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { answer } = require("./capture-manual.cjs");
const { legacyRequest } = require("./legacy-endpoint.cjs");
const base = process.env.DESIGN_BASE_URL || "http://127.0.0.1:8097";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw Error("Solo se permiten pruebas contra una exportación local.");
const output = path.resolve(__dirname, "../../../artifacts/visual-review/tv");
async function main() {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE,
  });
  const results = [];
  for (const size of process.env.PRESENTATION_EDGE_ONLY
    ? []
    : [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 390, height: 844 },
        { width: 844, height: 390 },
      ]) {
    const context = await browser.newContext({
      viewport: size,
      screen: size,
      colorScheme: "light",
      reducedMotion: "reduce",
    });
    await context.route("**/api/**", async (route) => {
      const { endpoint, body } = legacyRequest(route.request());
      const [status, json] = answer(endpoint, body, false);
      await route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(json),
      });
    });
    await context.route("https://manual-fixture.invalid/**", async (route) => {
      await route.fulfill({
        contentType: "image/jpeg",
        body: await fs.readFile(
          path.resolve(
            __dirname,
            "../assets/demo-gallery",
            new URL(route.request().url()).pathname.slice(1),
          ),
        ),
      });
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.setDefaultTimeout(15000);
    await page.goto(base, { waitUntil: "networkidle" });
    const menu = page.getByRole("button", {
      name: "Abrir menú de navegación",
      exact: true,
    });
    if (await menu.count()) await menu.click();
    await page
      .getByRole("button", { name: "Presentación TV", exact: true })
      .click();
    const start = page.getByRole("button", {
      name: "Iniciar presentación",
      exact: true,
    });
    await start.waitFor();
    assert.equal(await start.isEnabled(), true);
    await page
      .getByText("2 proyectos listos para presentar", { exact: true })
      .waitFor();
    await page.screenshot({
      path: path.join(output, `${size.width}-setup.png`),
    });
    await start.click();
    const viewer = page.getByTestId("presentation-viewer");
    await viewer.waitFor();
    await viewer
      .getByRole("heading", { name: "Brazo robótico", exact: true })
      .waitFor();
    await page.waitForTimeout(500);
    assert.ok(
      await page.evaluate(() => !!document.fullscreenElement),
      "Debe pedir pantalla completa",
    );
    const bounds = await viewer.boundingBox();
    const viewport = await page.evaluate(() => ({
      width: innerWidth,
      height: innerHeight,
    }));
    assert.ok(
      Math.abs(bounds.width - viewport.width) < 2 &&
        Math.abs(bounds.height - viewport.height) < 2,
      "El visor debe cubrir toda la pantalla",
    );
    await page.screenshot({
      path: path.join(output, `${size.width}-playing.png`),
    });
    await page.waitForTimeout(3600);
    const hidden = await page
      .getByRole("button", {
        name: "Pausar presentación",
        exact: true,
        includeHidden: true,
      })
      .evaluate(
        (el) => getComputedStyle(el.parentElement.parentElement).opacity,
      );
    assert.equal(hidden, "0", "Los controles se ocultan automáticamente");
    await viewer
      .getByRole("heading", { name: "Huerta inteligente", exact: true })
      .waitFor({ timeout: 11000 });
    await page.keyboard.press("ArrowLeft");
    await viewer
      .getByRole("heading", { name: "Brazo robótico", exact: true })
      .waitFor();
    await page.keyboard.press("Space");
    await page
      .getByRole("button", { name: "Reanudar presentación", exact: true })
      .waitFor();
    await page.waitForTimeout(8300);
    assert.ok(
      await viewer
        .getByRole("heading", { name: "Brazo robótico", exact: true })
        .isVisible(),
      "La pausa detiene el avance",
    );
    await page.keyboard.press("Space");
    await page
      .getByRole("button", { name: "Pausar presentación", exact: true })
      .waitFor();
    await page.mouse.move(30, 30);
    await page
      .getByRole("button", { name: "Salir de la presentación", exact: true })
      .click();
    await viewer.waitFor({ state: "detached" });
    assert.equal(
      await page.evaluate(() => !!document.fullscreenElement),
      false,
    );
    await start.click();
    await viewer.waitFor();
    await page.keyboard.press("Escape");
    await viewer.waitFor({ state: "detached" });
    assert.deepEqual(errors, []);
    results.push({
      size,
      checks: [
        "fullscreen",
        "immediate-start",
        "auto-hide",
        "auto-advance",
        "arrows",
        "pause",
        "resume",
        "exit-button",
        "escape",
      ],
      errors,
    });
    console.log("PASS", JSON.stringify(size));
    await context.close();
  }

  for (const scenario of [
    "empty",
    "load-error",
    "media-error",
    "fullscreen-denied",
    "long-text",
    "demo",
  ]) {
    const context = await browser.newContext({
      viewport: { width: 844, height: 390 },
      screen: { width: 844, height: 390 },
      reducedMotion: "reduce",
    });
    if (scenario === "fullscreen-denied")
      await context.addInitScript(() => {
        Element.prototype.requestFullscreen = () =>
          Promise.reject(new Error("Fullscreen no permitido en esta prueba"));
      });
    await context.route("**/api/**", async (route) => {
      const { endpoint, body } = legacyRequest(route.request());
      let [status, json] = answer(endpoint, body, false);
      if (endpoint === "/api/projects/presentation/query") {
        if (scenario === "empty") json = { projects: [], nextCursor: null };
        else if (scenario === "load-error") {
          status = 503;
          json = { error: { message: "Sin conexión de prueba" } };
        } else if (scenario === "media-error")
          json = {
            ...json,
            projects: json.projects.map((p, i) => ({
              ...p,
              imageUrl: "https://manual-fixture.invalid/broken.jpg",
              videoUrl:
                i === 0 ? "https://manual-fixture.invalid/broken.mp4" : "",
            })),
          };
        else if (scenario === "long-text")
          json = {
            ...json,
            projects: json.projects.map((p) => ({
              ...p,
              name: "Un proyecto con un título muy largo para comprobar la legibilidad en pantallas bajas y anchas",
              description: "Una descripción extensa. ".repeat(45),
              members: Array.from({ length: 20 }, () => ({
                firstName: "Estudiante",
                lastName: "de la muestra",
              })),
              spaceName: "Un espacio con un nombre muy extenso",
            })),
          };
      }
      await route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(json),
      });
    });
    await context.route("https://manual-fixture.invalid/**", (route) =>
      route.fulfill({ status: 404, body: "" }),
    );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.setDefaultTimeout(15000);
    await page.goto(base, { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: "Abrir menú de navegación", exact: true })
      .click();
    if (scenario === "demo") {
      await page
        .getByRole("button", { name: "Demostración", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Cambiar vista", exact: true })
        .click();
      await page.getByRole("button", { name: "Invitado", exact: true }).click();
      await page.getByRole("tab", { name: "TV", exact: true }).click();
    } else {
      await page
        .getByRole("button", { name: "Presentación TV", exact: true })
        .click();
    }
    const start = page.getByRole("button", {
      name: "Iniciar presentación",
      exact: true,
    });
    if (scenario === "empty" || scenario === "load-error") {
      await page
        .getByText(
          scenario === "empty"
            ? "0 proyectos listos para presentar"
            : /La presentación se pausó/,
        )
        .waitFor();
      assert.equal(await start.isDisabled(), true);
      assert.equal(await page.getByTestId("presentation-viewer").count(), 0);
    } else {
      if (scenario !== "demo")
        await page
          .getByText("2 proyectos listos para presentar", { exact: true })
          .waitFor();
      await start.click();
      const viewer = page.getByTestId("presentation-viewer");
      await viewer.waitFor();
      if (scenario === "fullscreen-denied") {
        await viewer.getByRole("alert").waitFor();
        assert.equal(
          await page.evaluate(() => !!document.fullscreenElement),
          false,
        );
      }
      if (scenario === "media-error") {
        await viewer.getByText(/Video no disponible/).waitFor();
        await viewer
          .getByRole("heading", { name: "Huerta inteligente", exact: true })
          .waitFor({ timeout: 12000 });
      }
      await page.screenshot({
        path: path.join(output, `case-${scenario}.png`),
      });
      const layout = await viewer.evaluate((el) => ({
        overflow: el.scrollHeight > el.clientHeight + 1,
        children: [
          ...el.querySelectorAll(
            '[data-testid="presentation-slide"] [role="heading"]',
          ),
        ].map((n) => ({
          bottom: n.getBoundingClientRect().bottom,
          height: innerHeight,
        })),
      }));
      assert.equal(layout.overflow, false);
      assert.ok(layout.children.every((n) => n.bottom < n.height));
      await page.mouse.move(10, 10);
      await page
        .getByRole("button", { name: "Salir de la presentación", exact: true })
        .click();
      await viewer.waitFor({ state: "detached" });
    }
    assert.deepEqual(errors, []);
    results.push({ scenario, errors });
    console.log("PASS", scenario);
    await context.close();
  }
  await browser.close();
  await fs.writeFile(
    path.join(
      output,
      process.env.PRESENTATION_EDGE_ONLY ? "edge-report.json" : "report.json",
    ),
    JSON.stringify(results, null, 2),
  );
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
