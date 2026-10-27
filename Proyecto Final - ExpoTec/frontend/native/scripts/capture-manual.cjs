/**
 * Capturas de pantalla para el manual de usuario (docs/capturas).
 *
 * Abre la exportación web local (`npm run export:web` + `npm run preview`)
 * en un tamaño de teléfono y responde todas las llamadas a la API con datos
 * de ejemplo: no se conecta a producción ni modifica ninguna base.
 *
 * Uso, desde frontend/native:
 *   npm run export:web
 *   PORT=8097 npm run preview          (en otra terminal)
 *   node scripts/capture-manual.cjs
 */
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { legacyRequest } = require("./legacy-endpoint.cjs");

const base = process.env.DESIGN_BASE_URL || "http://127.0.0.1:8097";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error("Las capturas solo se toman contra la exportación local.");
const output = path.resolve(__dirname, "../../../docs/capturas");

// ----- Datos de ejemplo (ficticios) -----
const now = "2026-10-20T13:00:00.000Z";
const account = {
  id: "11111111-1111-4111-8111-111111111111",
  firstName: "Martín",
  lastName: "García",
  email: "martin.garcia@example.com",
  roles: ["admin", "loans", "student", "teacher"],
  createdAt: now,
};
const people = {
  lucia: { id: "12121212-1212-4212-8212-121212121212", firstName: "Lucía", lastName: "Fernández" },
  mateo: { id: "22222222-2222-4222-8222-222222222222", firstName: "Mateo", lastName: "Díaz" },
  martin: { id: account.id, firstName: "Martín", lastName: "García" },
};
const tables = ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08"];
const furniture = [
  ...tables.map((id, index) => ({ id, type: "table", x: 16 + (index % 4) * 22, y: index < 4 ? 28 : 72, rotation: 0, width: 14, height: 9 })),
  { id: "B01", type: "bench", x: 50, y: 50, rotation: 0 },
  { id: "E01", type: "power", x: 4, y: 50, rotation: 0 },
  { id: "E02", type: "power", x: 96, y: 50, rotation: 0 },
];
const space = {
  id: "44444444-4444-4444-8444-444444444444",
  name: "Patio central",
  description: "Espacio abierto, planta baja",
  version: 3,
  createdAt: now,
  updatedAt: now,
  furniture,
  booths: tables.map((code, index) => ({
    id: `5555555${index}-5555-4555-8555-555555555555`,
    furnitureId: code,
    projectId: index === 0 ? "66666666-6666-4666-8666-666666666661" : null,
    projectName: index === 0 ? "Brazo robótico" : null,
  })),
};
const spaces = [space, { ...space, id: "44444444-4444-4444-8444-444444444445", name: "Aula 1", description: "Primer piso" }];
const project = (id, name, course, status, description, extra = {}) => ({
  id, name, course, status, description,
  imageUrl: `https://manual-fixture.invalid/${id.endsWith("1") ? "robot" : "electronics"}.jpg`,
  videoUrl: "", isSoftwareProject: false, githubUrl: "", websiteUrl: "",
  createdAt: now, updatedAt: now, version: 1, feedback: "",
  spaceName: "Patio central", furnitureId: "P01",
  members: [people.lucia, people.mateo], teachers: [people.martin],
  subjects: ["Automatización", "Electrónica"],
  booth: { id: space.booths[0].id, spaceId: space.id, spaceName: space.name, furnitureId: "P01" },
  reviews: [], resources: [], openLoanQuantity: 0, creatorId: account.id,
  ...extra,
});
const projects = [
  project("66666666-6666-4666-8666-666666666661", "Brazo robótico", "6° 1° · Electromecánica", "approved",
    "Un brazo controlado por Arduino que reconoce y clasifica objetos por color."),
  project("66666666-6666-4666-8666-666666666662", "Estación meteorológica", "6° 1° · Informática", "pending",
    "Medimos temperatura, humedad y presión, y una aplicación muestra los datos durante el día.",
    { furnitureId: "P03", booth: { id: space.booths[2].id, spaceId: space.id, spaceName: space.name, furnitureId: "P03" } }),
  project("66666666-6666-4666-8666-666666666663", "Huerta inteligente", "5° 2° · Informática", "approved",
    "El riego se adapta a la humedad del suelo para cuidar el consumo de agua.", { furnitureId: "P04" }),
];
const resource = (id, name, total, reserved) => ({
  id, name, description: "Elemento del depósito de la escuela.", total, reserved,
  available: total - reserved, unavailable: 0, outstanding: 1, availableToLend: total - 1,
  shortage: 0, version: 1, createdAt: now, updatedAt: now, archivedAt: null, events: [],
});
const resources = [
  resource("77777777-7777-4777-8777-777777777771", "Zapatillas eléctricas", 12, 4),
  resource("77777777-7777-4777-8777-777777777772", "Alargues", 10, 2),
  resource("77777777-7777-4777-8777-777777777773", "Sillas", 40, 9),
  resource("77777777-7777-4777-8777-777777777774", "Proyectores", 3, 1),
];
const loans = [
  { id: "88888888-8888-4888-8888-888888888881", projectId: projects[0].id, resourceId: resources[0].id,
    projectName: "Brazo robótico", resourceName: "Zapatillas eléctricas", day: 1, quantity: 2, returned: 0,
    version: 1, recipientId: people.mateo.id, note: "", createdAt: now,
    recipientFirstName: "Mateo", recipientLastName: "Díaz", deliveredFirstName: "Martín", deliveredLastName: "García", returns: [] },
  { id: "88888888-8888-4888-8888-888888888882", projectId: projects[2].id, resourceId: resources[2].id,
    projectName: "Huerta inteligente", resourceName: "Sillas", day: 1, quantity: 3, returned: 3,
    version: 2, recipientId: people.mateo.id, note: "", createdAt: now,
    recipientFirstName: "Sofía", recipientLastName: "López", deliveredFirstName: "Martín", deliveredLastName: "García", returns: [] },
];
const lendingProjects = [{
  id: projects[0].id, name: "Brazo robótico", course: "6° 1° · Electromecánica", version: 2,
  spaceName: "Patio central", furnitureId: "P01", members: [people.lucia, people.mateo],
  resources: [{ resourceId: resources[1].id, name: "Alargues", reservedQuantity: 1, total: 10, archivedAt: null,
    unavailable: 0, outstanding: 0, availableToLend: 8, loanId: null, deliverable: 1 }],
}];
const users = [
  { ...account, active: true },
  { ...people.mateo, email: "mateo.diaz@example.com", roles: ["student"], createdAt: now, active: true },
  { ...people.lucia, email: "lucia.fernandez@example.com", roles: ["student"], createdAt: now, active: true },
  { id: "99999999-9999-4999-8999-999999999999", firstName: "Paula", lastName: "Torres", email: "paula.torres@example.com", roles: ["teacher", "loans"], createdAt: now, active: true },
];
const photos = projects.map((item, index) => ({
  id: `aaaaaaa${index}-aaaa-4aaa-8aaa-aaaaaaaaaaaa`, imageUrl: item.imageUrl,
  caption: ["Así quedó el stand del brazo robótico.", "Primera medición de la estación.", "La huerta en funcionamiento."][index],
  authorName: "Lucía Fernández", createdAt: now, status: index === 1 ? "pending" : "approved", version: 1, updatedAt: now, reviewNote: "",
}));

/** Respuesta simulada para cada operación de la API. */
function answer(endpoint, body, signedIn) {
  const find = (list) => list.find((item) => endpoint.includes(item.id)) || list[0];
  if (endpoint.endsWith("/browser/refresh"))
    return signedIn ? [200, { accessToken: "manual-fixture", expiresIn: 3600, user: account }] : [401, { error: { message: "Sin sesión." } }];
  const table = {
    "/api/auth/session": { user: account },
    "/api/auth/recovery/query": { enabled: true },
    "/api/auth/social/providers/query": { providers: [{ id: "google", name: "Google" }, { id: "discord", name: "Discord" }, { id: "github", name: "GitHub" }] },
    "/api/spaces/query": { spaces: spaces.map(({ furniture: f, booths, ...rest }) => ({ ...rest, furnitureCount: f.length, boothCount: booths.length })) },
    "/api/projects/public/query": { projects: body.offset ? [] : projects.filter((item) => item.status === "approved") },
    "/api/projects/query": { projects: body.offset ? [] : projects },
    "/api/projects/presentation/query": { projects: projects.filter((item) => item.status === "approved"), nextCursor: null },
    "/api/gallery/public/query": { photos: body.offset ? [] : photos.filter((item) => item.status === "approved") },
    "/api/gallery/mine/query": { photos: body.offset ? [] : photos },
    "/api/gallery/moderation/query": { photos: body.offset ? [] : photos },
    "/api/inventory/query": { resources: body.offset ? [] : resources },
    "/api/inventory/catalog/query": { resources },
    "/api/loans/query": { loans: body.offset ? [] : loans, summary: { pendingCount: 1, pendingQuantity: 2 } },
    "/api/loans/projects/query": { projects: body.offset ? [] : lendingProjects },
    "/api/admin/users/query": { users: body.offset ? [] : users },
  };
  if (table[endpoint]) return [200, table[endpoint]];
  if (/^\/api\/spaces\/[^/]+\/query$/.test(endpoint)) return [200, { space: find(spaces) }];
  if (/^\/api\/projects\/(public\/)?[^/]+\/query$/.test(endpoint)) return [200, { project: find(projects) }];
  if (/^\/api\/inventory\/[^/]+\/query$/.test(endpoint)) return [200, { resource: find(resources) }];
  if (/^\/api\/loans\/[^/]+\/query$/.test(endpoint)) return [200, { loan: find(loans) }];
  if (/^\/api\/admin\/users\/[^/]+\/query$/.test(endpoint)) return [200, { user: find(users) }];
  return [400, { error: { message: `Operación no preparada para las capturas: ${endpoint}` } }];
}

async function main() {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: "light", reducedMotion: "reduce" });
  let signedIn = false;
  await context.route("https://manual-fixture.invalid/**", async (route) => {
    const file = new URL(route.request().url()).pathname.slice(1);
    await route.fulfill({ contentType: "image/jpeg", body: await fs.readFile(path.resolve(__dirname, "../assets/demo-gallery", file)) });
  });
  await context.route("**/api/**", async (route) => {
    const { endpoint, body } = legacyRequest(route.request());
    const [status, json] = answer(endpoint, body, signedIn);
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(json) });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  /** Espera a que la pantalla termine de dibujarse y guarda la captura. */
  async function capture(name) {
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(700);
    // Quita el foco para que la captura no muestre el contorno del último botón usado.
    await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
    await page.screenshot({ path: path.join(output, `${name}.png`) });
    console.error("captura", name);
  }
  /** Abre una sección desde el menú de navegación del teléfono. */
  async function navigate(name) {
    await page.getByRole("button", { name: "Abrir menú de navegación", exact: true }).click();
    await page.getByRole("button", { name, exact: true }).click();
  }

  // 1. Acceso sin sesión: ingreso, registro y proveedores sociales.
  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await capture("01-ingreso");

  // A partir de aquí, sesión iniciada con todos los permisos.
  signedIn = true;
  await page.goto(base, { waitUntil: "networkidle" });
  await capture("02-espacios");

  await page.getByRole("button", { name: "Abrir menú de navegación", exact: true }).click();
  await capture("03-menu");
  await page.getByRole("button", { name: "Proyectos", exact: true }).click();
  await capture("04-proyectos");

  await page.getByRole("button", { name: "Presentar proyecto", exact: true }).click();
  await capture("05-propuesta");

  await page.goto(base, { waitUntil: "networkidle" });
  await navigate("Proyectos");
  await page.getByRole("radio", { name: "Gestionar proyectos" }).or(page.getByRole("button", { name: "Gestionar proyectos" })).first().click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /Ver proyecto/ }).nth(1).click();
  await capture("06-revision");
  // Segunda vista de la revisión: las acciones del profesor al final de la ficha.
  await page.getByRole("button", { name: /Solicitar cambios/ }).first().scrollIntoViewIfNeeded();
  await capture("06b-revision-acciones");

  await page.goto(base, { waitUntil: "networkidle" });
  await navigate("Préstamos");
  await capture("07-prestamos");

  await page.goto(base, { waitUntil: "networkidle" });
  await navigate("Inventario");
  await capture("08-inventario");

  await page.goto(base, { waitUntil: "networkidle" });
  await navigate("Galería de la ExpoTec");
  await capture("09-galeria");

  await page.goto(base, { waitUntil: "networkidle" });
  await navigate("Usuarios y permisos");
  await capture("10-usuarios");

  await page.goto(base, { waitUntil: "networkidle" });
  await navigate("Presentación TV");
  await capture("11-presentacion");

  await page.goto(base, { waitUntil: "networkidle" });
  await navigate("Demostración");
  await capture("12-demostracion");

  await browser.close();
  if (errors.length) throw new Error(`Errores en la página: ${errors.join(" | ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
