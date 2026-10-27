/* Ensayo web aislado: los cambios de espacios se guardan sólo en fixtures de memoria. */
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { legacyRequest } = require("./legacy-endpoint.cjs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
require("tsx/cjs");
const { seed } = require("../src/lib/seed.ts");
const { TABLE_SIZE } = require("../src/lib/layout.ts");

const base = process.env.DESIGN_BASE_URL || "http://127.0.0.1:8097";
const origin = new URL(base).origin;
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error("La revisión sólo admite localhost.");
const output = path.resolve(__dirname, "../../../artifacts/mobile-fixes");
const viewports = [
  { width: 320, height: 812 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 },
];
const account = {
  id: "mobile-fixture-admin",
  firstName: "Administración",
  lastName: "de prueba",
  email: "mobile@example.invalid",
  roles: ["admin"],
  active: true,
  createdAt: "2026-10-13",
};
const initialSpace = {
  id: "mobile-space",
  name: "Patio de prueba",
  description: "Distribución local para comprobar la edición móvil.",
  createdAt: "2026-10-13",
  updatedAt: "2026-10-13",
  version: 1,
  furniture: [
    { id: "M01", type: "table", x: 34, y: 38, width: 18, height: 10, rotation: 30 },
    { id: "B01", type: "bench", x: 72, y: 70, rotation: 0 },
    { id: "E01", type: "power", x: 14, y: 74, rotation: 0 },
  ],
  booths: [{ id: "booth-fixture", furnitureId: "M01" }],
};
const project = {
  id: "mobile-project",
  name: "Proyecto de prueba móvil",
  course: "6° año · Informática",
  description: "Ficha ficticia usada únicamente en la revisión local de la interfaz.",
  status: "approved",
  imageUrl: "",
  videoUrl: "",
  githubUrl: "",
  websiteUrl: "",
  isSoftwareProject: false,
  createdAt: "2026-10-13",
  spaceName: initialSpace.name,
  furnitureId: "M01",
  members: [{ firstName: "Equipo", lastName: "de prueba" }],
  teachers: [{ firstName: "Docente", lastName: "de prueba" }],
  subjects: ["Programación"],
  booth: { id: "booth-fixture", spaceId: initialSpace.id, spaceName: initialSpace.name, furnitureId: "M01" },
};

async function run() {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
  const checks = [], screenshots = [], runtimeErrors = [], unexpectedRequests = [], savedSpaces = [];
  let activePage;
  const record = (name, details = {}) => checks.push({ name, ...details });
  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport, colorScheme: "light", reducedMotion: "reduce" });
      const page = await context.newPage();
      activePage = page;
      let space = structuredClone(initialSpace);
      let savedBody;
      page.on("pageerror", (error) => runtimeErrors.push(error.message));
      await context.route("**/*", (route) => {
        if (new URL(route.request().url()).origin === origin) return route.continue();
        unexpectedRequests.push(route.request().url());
        return route.abort();
      });
      await context.route("**/api/**", async (route) => {
        const { endpoint, body } = legacyRequest(route.request());
        const reply = (value, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(value) });
        if (endpoint.endsWith("/browser/refresh")) return reply({ user: account, accessToken: "local-mobile-fixture", expiresIn: 3600 });
        if (endpoint === "/api/auth/session") return reply({ user: account });
        if (endpoint === "/api/auth/recovery/query") return reply({ enabled: false });
        if (endpoint === "/api/auth/social/providers/query") return reply({ providers: [] });
        if (endpoint === "/api/spaces/query") return reply({ spaces: [{ ...space, furnitureCount: space.furniture.length, boothCount: space.booths.length }] });
        if (endpoint === `/api/spaces/${space.id}/query`) return reply({ space });
        if (endpoint === `/api/spaces/${space.id}/save`) {
          assert.equal(body.version, space.version);
          savedBody = structuredClone(body);
          space = { ...space, ...body, version: space.version + 1, booths: space.booths.filter((booth) => body.boothFurnitureIds.includes(booth.furnitureId)) };
          savedSpaces.push({ viewport: viewport.width, body: savedBody });
          return reply({ space });
        }
        if (endpoint === "/api/projects/public/query" || endpoint === "/api/projects/query") return reply({ projects: body.offset ? [] : [project] });
        if (endpoint === `/api/projects/public/${project.id}/query` || endpoint === `/api/projects/${project.id}/query`) return reply({ project });
        unexpectedRequests.push(endpoint);
        return reply({ error: { message: "Ruta ajena al ensayo aislado." } }, 400);
      });

      async function navigate(label) {
        if (viewport.width < 1200 || !(await page.getByRole("navigation", { name: "Navegación principal" }).isVisible()))
          await page.getByRole("button", { name: "Abrir menú de navegación", exact: true }).click();
        await page.getByRole("button", { name: label, exact: true }).click();
      }
      async function overflow(label) {
        const outside = await page.evaluate(() => {
          const width = document.documentElement.clientWidth;
          return [...document.querySelectorAll('[role="button"],input,[data-testid="floorplan-stage"],[data-testid="furniture-transform-controls"]')]
            .filter((element) => element.getClientRects().length)
            .map((element) => ({ label: element.getAttribute("aria-label") || element.getAttribute("data-testid") || element.textContent, rect: element.getBoundingClientRect() }))
            .filter(({ rect }) => rect.width > 0 && (rect.left < -1.5 || rect.right > width + 1.5))
            .map(({ label, rect }) => ({ label, x: rect.x, width: rect.width }));
        });
        assert.deepEqual(outside, [], `${label}: desborde horizontal`);
        record(`${label}: sin desbordes`);
      }
      async function capture(label) {
        const artifact = `${label}-${viewport.width}.png`;
        await page.screenshot({ path: path.join(output, artifact) });
        screenshots.push({ viewport, artifact });
      }
      async function select(id) {
        const piece = page.locator('[data-testid="floorplan-stage"]:visible').getByTestId(`furniture-${id}`);
        await piece.getByRole("button").click();
        await page.getByTestId("selected-furniture-properties").waitFor();
        await page.getByTestId("selected-furniture-properties").getByText(new RegExp(id)).waitFor();
      }
      async function cycleSelection(first, second, label) {
        if (viewport.width >= 900) return;
        const panel = page.getByTestId("selected-furniture-properties");
        await page.getByRole("button", { name: "Seleccionar pieza siguiente", exact: true }).click();
        await panel.getByText(new RegExp(first)).waitFor();
        await page.getByRole("button", { name: "Seleccionar pieza siguiente", exact: true }).click();
        await panel.getByText(new RegExp(second)).waitFor();
        await page.getByRole("button", { name: "Seleccionar pieza anterior", exact: true }).click();
        await panel.getByText(new RegExp(first)).waitFor();
        record(`${label}: selector móvil recorre y recupera piezas`);
      }
      async function geometry(id, label) {
        const measured = await page.evaluate((furnitureId) => {
          const stage = [...document.querySelectorAll('[data-testid="floorplan-stage"]')].find((element) => element.getBoundingClientRect().width > 0);
          const wrapper = stage.querySelector(`[data-testid="furniture-${furnitureId}"]`);
          const visual = wrapper.querySelector('[role="button"]').firstElementChild;
          const selectionLayer = [...stage.querySelectorAll("svg")].find((element) => getComputedStyle(element).zIndex === "30");
          const polygon = selectionLayer?.querySelector("polygon,path");
          const rect = (element) => { const { x, y, width, height, right, bottom } = element.getBoundingClientRect(); return { x, y, width, height, right, bottom }; };
          return { stage: rect(stage), visual: rect(visual), outline: polygon ? rect(polygon) : null, handles: stage.querySelectorAll('[data-testid^="resize-knob-"]').length };
        }, id);
        assert.ok(measured.outline, `${label}: falta selección visible`);
        assert.ok(measured.visual.width >= 15 && measured.visual.height >= 14, `${label}: mueble ilegible`);
        for (const dimension of ["x", "y", "width", "height"])
          assert.ok(Math.abs(measured.visual[dimension] - measured.outline[dimension]) <= 4, `${label}: contorno separado del mueble (${dimension})`);
        assert.equal(measured.handles, viewport.width < 900 ? 0 : 4, `${label}: controles táctiles/desktop incorrectos`);
        if (viewport.width < 700) assert.ok(measured.stage.height <= 282, `${label}: plano móvil demasiado alto`);
        record(`${label}: geometría y selección coincidentes`, measured);
      }
      async function controlsNearPlan(label) {
        const stage = await page.locator('[data-testid="floorplan-stage"]:visible').boundingBox();
        const panel = await page.getByTestId("selected-furniture-properties").boundingBox();
        if (viewport.width < 900) {
          const gap = panel.y - stage.y - stage.height;
          assert.ok(gap >= 0 && gap <= 125, `${label}: controles alejados del plano (${gap})`);
          record(`${label}: controles tras el plano`, { gap });
        } else record(`${label}: controles junto al plano`, { stage, panel });
      }
      async function dragFurniture(id, label) {
        const piece = page.locator('[data-testid="floorplan-stage"]:visible').getByTestId(`furniture-${id}`);
        await piece.scrollIntoViewIfNeeded();
        const before = await piece.boundingBox();
        const x = before.x + before.width / 2, y = before.y + before.height / 2;
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + 14, y + 9, { steps: 5 });
        await page.mouse.up();
        await page.waitForFunction(({ furnitureId, previous }) => {
          const stage = [...document.querySelectorAll('[data-testid="floorplan-stage"]')].find((element) => element.getBoundingClientRect().width > 0);
          const next = stage.querySelector(`[data-testid="furniture-${furnitureId}"]`).getBoundingClientRect();
          return next.x > previous.x + 5 && next.y > previous.y + 2;
        }, { furnitureId: id, previous: before });
        record(`${label}: gesto de arrastre web mueve la pieza`, { before, after: await piece.boundingBox(), input: "mouse; no valida touch Android" });
      }
      async function showPlan() {
        await page.locator('[data-testid="floorplan-stage"]:visible').evaluate((stage) => {
          let parent = stage.parentElement;
          while (parent && !(parent.scrollHeight > parent.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(parent).overflowY))) parent = parent.parentElement;
          if (parent) {
            if (window.innerWidth >= 900) parent.scrollTop = 0;
            else parent.scrollTop += stage.getBoundingClientRect().top - parent.getBoundingClientRect().top - 8;
          }
        });
      }

      await page.goto(base, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Acomodar espacio", exact: true }).waitFor();
      await navigate("Proyectos");
      await page.getByRole("button", { name: `Ver proyecto ${project.name}`, exact: true }).click();
      await page.getByRole("heading", { name: project.name, exact: true }).waitFor();
      const header = await page.getByTestId("app-header").boundingBox();
      const title = await page.getByText("Proyecto compartido", { exact: true }).boundingBox();
      const titleGap = title.y - header.y - header.height;
      assert.ok(titleGap >= 0 && titleGap <= 32, `Header ${viewport.width}: espacio extra antes del título (${titleGap})`);
      record(`Header web ${viewport.width}: separación normal`, { header, title, titleGap, nativeValidated: false });
      await overflow(`Header ${viewport.width}`);
      await capture("shared-project-header");
      await navigate("Espacios");
      await page.getByRole("button", { name: "Acomodar espacio", exact: true }).click();
      await cycleSelection("M01", "B01", `Compartido ${viewport.width}`);
      await select("M01");
      await geometry("M01", `Compartido ${viewport.width} inicial`);
      await controlsNearPlan(`Compartido ${viewport.width}`);
      await page.getByRole("button", { name: "Girar 90 grados a la derecha", exact: true }).click();
      await page.getByText("Giro · 120°", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Aumentar ancho de la mesa", exact: true }).click();
      await page.getByRole("button", { name: "Aumentar fondo de la mesa", exact: true }).click();
      await page.getByRole("button", { name: "Ángulo exacto", exact: true }).click();
      await page.getByRole("textbox", { name: "Giro en grados", exact: true }).fill("37");
      await page.getByRole("button", { name: "Aplicar giro", exact: true }).click();
      await page.getByText("Giro · 37°", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Cerrar ángulo exacto", exact: true }).click();
      await dragFurniture("M01", `Compartido ${viewport.width}`);
      await geometry("M01", `Compartido ${viewport.width} girado y redimensionado`);
      await overflow(`Editor compartido ${viewport.width}`);
      await showPlan();
      await capture("shared-editor");
      await page.getByRole("button", { name: "Activar modo oscuro", exact: true }).click();
      await capture("shared-editor-dark");
      await page.getByRole("button", { name: "Guardar plano", exact: true }).click();
      await page.getByRole("button", { name: "Acomodar espacio", exact: true }).waitFor();
      assert.ok(savedBody, "No se guardó el borrador en el fixture");
      const savedTable = savedBody.furniture.find((item) => item.id === "M01");
      assert.equal(savedTable.rotation, 37);
      assert.equal(savedTable.width, 20);
      assert.equal(savedTable.height, 11);
      assert.ok(savedTable.x > initialSpace.furniture[0].x && savedTable.y > initialSpace.furniture[0].y, "El guardado debe conservar la posición arrastrada");
      assert.equal(savedBody.name, initialSpace.name);
      assert.equal(savedBody.description, initialSpace.description);
      assert.deepEqual(savedBody.boothFurnitureIds, ["M01"]);
      assert.equal(savedBody.furniture.length, initialSpace.furniture.length);
      record(`Compartido ${viewport.width}: guarda geometría y conserva datos/puesto`);
      await page.getByRole("button", { name: "Acomodar espacio", exact: true }).click();
      await select("M01");
      await page.getByRole("button", { name: "Girar 15 grados a la derecha", exact: true }).click();
      await page.getByText("Giro · 52°", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Descartar borrador y recargar", exact: true }).click();
      await page.getByRole("button", { name: "Descartar y recargar", exact: true }).click();
      await page.getByRole("button", { name: "Acomodar espacio", exact: true }).click();
      await select("M01");
      await page.getByText("Giro · 37°", { exact: true }).waitFor();
      assert.equal(savedSpaces.filter((item) => item.viewport === viewport.width).length, 1);
      record(`Compartido ${viewport.width}: descartar recupera versión guardada`);
      await page.getByRole("button", { name: "Descartar borrador y recargar", exact: true }).click();
      await page.getByRole("button", { name: "Descartar y recargar", exact: true }).click();

      await navigate("Demostración");
      await page.getByRole("button", { name: "Acomodar espacio", exact: true }).click();
      await cycleSelection("P01", "P02", `Demo ${viewport.width}`);
      await select("P01");
      await geometry("P01", `Demo ${viewport.width} inicial`);
      await controlsNearPlan(`Demo ${viewport.width}`);
      await page.getByRole("button", { name: "Girar 15 grados a la derecha", exact: true }).click();
      await page.getByRole("button", { name: "Aumentar ancho de la mesa", exact: true }).click();
      await page.getByRole("button", { name: "Aumentar fondo de la mesa", exact: true }).click();
      await page.getByText("Giro · 15°", { exact: true }).waitFor();
      await dragFurniture("P01", `Demo ${viewport.width}`);
      await geometry("P01", `Demo ${viewport.width} transformada`);
      await overflow(`Editor demo ${viewport.width}`);
      await showPlan();
      await capture("demo-editor-dark");
      await page.getByRole("button", { name: "Guardar plano", exact: true }).click();
      await page.waitForFunction(() => {
        const saved = JSON.parse(localStorage.getItem("expotec-design-v1") || "null");
        return saved?.spaces.find((item) => item.id === "patio")?.furniture.find((item) => item.id === "P01")?.rotation === 15;
      });
      const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem("expotec-design-v1")));
      const demoTable = persisted.spaces.find((item) => item.id === "patio").furniture.find((item) => item.id === "P01");
      assert.equal(demoTable.width, TABLE_SIZE.width + 2);
      assert.equal(demoTable.height, TABLE_SIZE.height + 1);
      const sourceTable = seed.spaces.find((item) => item.id === "patio").furniture.find((item) => item.id === "P01");
      assert.ok(demoTable.x > sourceTable.x && demoTable.y > sourceTable.y, "La demo debe persistir el arrastre");
      assert.deepEqual(persisted.resources, seed.resources);
      record(`Demo ${viewport.width}: persiste giro/tamaño sin cambiar inventario`);
      await page.getByRole("button", { name: "Acomodar espacio", exact: true }).click();
      await select("P01");
      await page.getByRole("button", { name: "Girar 15 grados a la derecha", exact: true }).click();
      await page.getByText("Giro · 30°", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Cancelar", exact: true }).click();
      await page.getByRole("button", { name: "Acomodar espacio", exact: true }).click();
      await select("P01");
      await page.getByText("Giro · 15°", { exact: true }).waitFor();
      record(`Demo ${viewport.width}: cancelar conserva la geometría guardada`);
      await context.close();
    }
    assert.deepEqual(runtimeErrors, [], "Errores de ejecución");
    assert.deepEqual(unexpectedRequests, [], "Peticiones no previstas en fixtures");
    const report = { status: "PASS", scope: "Expo Web local con API interceptada y datos ficticios; no prueba una APK instalada.", checks, screenshots, savedSpaces, runtimeErrors, unexpectedRequests };
    await fs.writeFile(path.join(output, "evidence.json"), JSON.stringify(report, null, 2));
    await fs.rm(path.join(output, "failure.png"), { force: true });
    console.log(JSON.stringify({ status: "PASS", checks: checks.length, screenshots: screenshots.length, errors: runtimeErrors.length, output }, null, 2));
  } catch (error) {
    await activePage?.screenshot({ path: path.join(output, "failure.png") }).catch(() => {});
    await fs.writeFile(path.join(output, "evidence.json"), JSON.stringify({ status: "FAIL", error: error.message, checks, screenshots, runtimeErrors, unexpectedRequests }, null, 2));
    throw error;
  } finally {
    await browser.close();
  }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
