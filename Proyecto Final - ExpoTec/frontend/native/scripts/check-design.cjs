/* Revisión local aislada: todos los endpoints se interceptan; no modifica TiDB. */
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { legacyRequest } = require("./legacy-endpoint.cjs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
require("tsx/cjs");
const { seed } = require("../src/lib/seed.ts");
const { light } = require("../src/theme/light.ts");
const { dark } = require("../src/theme/dark.ts");

const base = process.env.DESIGN_BASE_URL || "http://127.0.0.1:8097";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error("La revisión sólo puede ejecutarse contra localhost.");
const output = path.resolve(__dirname, "../../../artifacts/design-review");
const targetViewports = [
  "320x812",
  "390x844",
  "768x1024",
  "1024x900",
  "1365x1000",
  "1440x1000",
  "1536x1000",
  "1691x1000",
];
const user = {
  id: "design-test",
  firstName: "Cuenta",
  lastName: "de prueba",
  email: "design@example.invalid",
  roles: ["admin"],
  active: true,
  createdAt: "2026-10-13",
};
const users = [
  user,
  { ...user, id: "design-teacher", firstName: "Docente", lastName: "de prueba", email: "docente.expotec@example.invalid", roles: ["teacher"] },
  { ...user, id: "design-student", firstName: "Estudiante", lastName: "de prueba", email: "estudiante.expotec@example.invalid", roles: ["student"] },
  { ...user, id: "design-team", firstName: "María Alejandra", lastName: "Fernández de los Santos", email: "maria.alejandra.fernandez.equipo@example.invalid", roles: ["student", "teacher"] },
  { ...user, id: "design-admin", firstName: "Coordinación", lastName: "ExpoTec", email: "coordinacion.expotec@example.invalid", roles: ["admin", "student", "teacher"] },
  { ...user, id: "design-volunteer", firstName: "Ayudante", lastName: "de exposición", email: "ayudante.exposicion@example.invalid", roles: [] },
];
const spaces = seed.spaces.map((space) => ({
  ...space,
  version: 1,
  updatedAt: space.createdAt,
  booths: space.furniture
    .filter((item) => item.type === "table")
    .map((item) => ({ id: item.id, furnitureId: item.id })),
}));
const approvedProjects = seed.projects.filter((project) => project.status === "approved");
const projects = Array.from({ length: 6 }, (_, index) => {
  const project = approvedProjects[index % approvedProjects.length];
  return {
    ...project,
    id: index < approvedProjects.length ? project.id : `${project.id}-fixture-${index}`,
    name:
      index === 1
        ? "Huerta inteligente con monitoreo de humedad y riego automático"
        : index < approvedProjects.length ? project.name : `${project.name} · equipo ${index + 1}`,
    imageUrl: `https://design-fixture.invalid/${index % 2 ? "electronics" : "robot"}.jpg`,
    videoUrl: "",
    isSoftwareProject: false,
    githubUrl: "",
    websiteUrl: "",
    spaceName: seed.spaces.find((space) => space.id === project.spaceId).name,
    members: [{ id: user.id, firstName: "Equipo", lastName: "de prueba" }],
    teachers: [{ firstName: "Docente", lastName: "de prueba" }],
    booth: {
      id: project.furnitureId,
      spaceId: project.spaceId,
      spaceName: spaces[0].name,
      furnitureId: project.furnitureId,
    },
  };
});
const resources = Array.from({ length: 6 }, (_, index) => {
  const resource = seed.resources[index % seed.resources.length];
  return {
    ...resource,
    id: index < seed.resources.length ? resource.id : `${resource.id}-fixture-${index}`,
    name: index < seed.resources.length ? resource.name : `${resource.name} del taller ${index + 1}`,
    description: "Recurso de demostración para revisar la interfaz.",
    reserved: 1,
    available: resource.total - 1,
    unavailable: 0,
    outstanding: 1,
    availableToLend: resource.total - 1,
    shortage: 0,
    version: 1,
    updatedAt: resource.createdAt,
    archivedAt: null,
    events: [],
  };
});
const loans = projects.slice(0, 3).map((project, index) => ({
  id: `loan-${index}`,
  projectId: project.id,
  resourceId: resources[index].id,
  projectName: project.name,
  resourceName: resources[index].name,
  day: 1,
  quantity: index + 2,
  returned: index,
  version: 1,
  recipientId: user.id,
  note:
    index === 1
      ? "Observación de prueba con una descripción más larga para comprobar el ajuste de las fichas."
      : "",
  createdAt: project.createdAt,
  recipientFirstName: "Equipo",
  recipientLastName: "de prueba",
  deliveredFirstName: "Cuenta",
  deliveredLastName: "de prueba",
  returns: [],
}));

async function main() {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  const unexpected = [];
  const captures = [];
  const checks = [];
  const gridEvidence = [];
  const luminance = (hex) => {
    const channel = hex
      .slice(1)
      .match(/../g)
      .map((value) => parseInt(value, 16) / 255)
      .map((value) =>
        value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
      );
    return channel[0] * 0.2126 + channel[1] * 0.7152 + channel[2] * 0.0722;
  };
  const pairs = [
    ["text", "page"],
    ["text", "surface"],
    ["muted", "page"],
    ["muted", "surface"],
    ["muted", "selectedContainer"],
    ["muted", "infoContainer"],
    ["muted", "accentContainer"],
    ["onPrimary", "primary"],
    ["onPrimary", "primaryHover"],
    ["onSecondaryContainer", "secondaryContainer"],
    ["onSelectedContainer", "selectedContainer"],
    ["success", "successContainer"],
    ["onWarning", "warning"],
    ["error", "errorContainer"],
    ["info", "infoContainer"],
    ["accent", "accentContainer"],
    ["onNavigation", "navigation"],
    ["navigationMuted", "navigation"],
    ["navigationAccent", "navigationSelected"],
  ];
  const contrast = [light, dark].flatMap((palette) =>
    pairs.map(([foreground, background]) => {
      const a = luminance(palette[foreground]),
        b = luminance(palette[background]);
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      assert.ok(
        ratio >= 4.5,
        `Contraste insuficiente: ${foreground}/${background}`,
      );
      return {
        theme: palette.dark ? "dark" : "light",
        foreground,
        background,
        ratio,
      };
    }),
  );
  const neutralSurfaces = ["page", "surface", "surfaceVariant", "navigation", "canvas", "table"].map((token) => {
    const rgb = dark[token].slice(1).match(/../g).map((channel) => parseInt(channel, 16));
    const spread = Math.max(...rgb) - Math.min(...rgb);
    assert.ok(spread <= 14, `Modo oscuro: ${token} tiene un tinte dominante (${dark[token]})`);
    assert.ok(rgb[2] - Math.min(rgb[0], rgb[1]) <= 10, `Modo oscuro: ${token} es demasiado azul`);
    return { token, color: dark[token], spread };
  });
  checks.push("Fondos y superficies oscuras neutros, sin predominio azul");
  let mode = "normal",
    signedIn = true,
    delayRelease;
  page.on("pageerror", (error) => errors.push(error.message));
  await context.route("https://design-fixture.invalid/**", async (route) => {
    const image = new URL(route.request().url()).pathname.slice(1);
    await route.fulfill({
      contentType: "image/jpeg",
      body: await fs.readFile(
        path.resolve(__dirname, "../assets/demo-gallery", image),
      ),
    });
  });
  await context.route("**/api/**", async (route) => {
    const { endpoint, body } = legacyRequest(route.request());
    const reply = (json, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(json),
      });
    if (endpoint.endsWith("/browser/refresh"))
      return signedIn
        ? reply({
            accessToken: "isolated-design-fixture",
            expiresIn: 3600,
            user,
          })
        : reply({ error: { message: "Sin sesión de prueba." } }, 401);
    if (endpoint === "/api/auth/session") return reply({ user });
    if (endpoint === "/api/auth/recovery/query")
      return reply({ enabled: true });
    if (endpoint === "/api/auth/social/providers/query")
      return reply({ providers: [] });
    if (endpoint === "/api/spaces/query")
      return reply({
        spaces: spaces.map((space) => ({
          ...space,
          furnitureCount: space.furniture.length,
          boothCount: space.booths.length,
        })),
      });
    if (/^\/api\/spaces\/[^/]+\/query$/.test(endpoint))
      return reply({
        space: spaces.find((space) => endpoint.includes(space.id)) || spaces[0],
      });
    if (
      endpoint === "/api/projects/public/query" ||
      endpoint === "/api/projects/query"
    ) {
      if (mode === "loading")
        await new Promise((resolve) => {
          delayRelease = resolve;
        });
      if (mode === "error")
        return reply(
          {
            error: {
              message: "No pudimos consultar los proyectos. Volvé a intentar.",
            },
          },
          503,
        );
      return reply({
        projects:
          mode === "empty"
            ? []
            : body.offset
              ? []
              : projects.map((project) => ({ ...project, imageUrl: mode === "no-images" ? "" : project.imageUrl })),
      });
    }
    if (/^\/api\/projects\/(public\/)?[^/]+\/query$/.test(endpoint))
      return reply({
        project:
          projects.find((project) => endpoint.includes(project.id)) ||
          projects[0],
      });
    if (endpoint === "/api/gallery/public/query")
      return reply({
        photos: projects.slice(0, 3).map((project, index) => ({
          id: project.id,
          imageUrl:
            mode === "partial" && index === 0
              ? `${base}/missing-photo.jpg`
              : project.imageUrl,
          caption:
            index === 1
              ? "Una descripción más larga de la exposición para verificar que las tarjetas mantengan su alineación."
              : "Recuerdo de demostración de la exposición.",
          authorName: "Equipo de prueba",
          createdAt: project.createdAt,
        })),
      });
    if (endpoint === "/api/inventory/query") return reply({ resources });
    if (/^\/api\/inventory\/[^/]+\/query$/.test(endpoint))
      return reply({
        resource:
          resources.find((resource) => endpoint.includes(resource.id)) ||
          resources[0],
      });
    if (endpoint === "/api/loans/query")
      return reply({ loans, summary: { pendingCount: 3, pendingQuantity: 6 } });
    if (/^\/api\/loans\/[^/]+\/query$/.test(endpoint))
      return reply({
        loan: loans.find((loan) => endpoint.includes(loan.id)) || loans[0],
      });
    if (endpoint === "/api/admin/users/query") return reply({ users: body.offset ? [] : users });
    if (endpoint === "/api/inventory/create")
      return reply({
        resource: { ...resources[0], id: "created-local-fixture" },
      });
    unexpected.push(endpoint);
    return reply(
      { error: { message: `Endpoint de prueba no preparado: ${endpoint}` } },
      400,
    );
  });
  await context.route(`${base}/missing-photo.jpg`, (route) =>
    route.fulfill({ status: 404, body: "Imagen de prueba ausente." }),
  );

  async function navigate(name) {
    if (page.viewportSize().width >= 1200) {
      await page
        .getByRole("navigation", { name: "Navegación principal" })
        .waitFor();
    } else {
      await page
        .getByRole("button", { name: "Abrir menú de navegación", exact: true })
        .click();
      await page.waitForFunction(
        () =>
          document.activeElement?.getAttribute("aria-label") === "Cerrar menú",
      );
    }
    await page.getByRole("button", { name, exact: true }).click();
  }
  async function overflow(label) {
    await page.waitForFunction(
      () =>
        [
          ...document.querySelectorAll(
            "[role=button], [role=radio], input, textarea",
          ),
        ].every((element) => {
          if (element.closest('[aria-hidden="true"]')) return true;
          const rect = element.getBoundingClientRect();
          return (
            !rect.width ||
            !rect.height ||
            (rect.left >= -1 && rect.right <= innerWidth + 1)
          );
        }),
      null,
      { timeout: 5000 },
    );
    const result = await page.evaluate(() => {
      const outside = [
        ...document.querySelectorAll(
          "[role=button], [role=radio], input, textarea",
        ),
      ]
        .filter((element) => {
          if (element.closest('[aria-hidden="true"]')) return false;
          const rect = element.getBoundingClientRect();
          return (
            rect.width &&
            rect.height &&
            (rect.left < -1 || rect.right > innerWidth + 1)
          );
        })
        .map(
          (element) =>
            element.getAttribute("aria-label") || element.textContent,
        );
      return {
        width: innerWidth,
        pageWidth: document.documentElement.scrollWidth,
        outside,
      };
    });
    assert.ok(result.pageWidth <= result.width, `${label}: desborde de página`);
    assert.deepEqual(
      result.outside,
      [],
      `${label}: controles fuera de pantalla`,
    );
    checks.push(`${label}: sin desbordes ni controles recortados`);
  }
  async function capture(name, observation) {
    const viewport = page.viewportSize();
    const artifact = `${name}-${viewport.width}.png`;
    await page.screenshot({ path: path.join(output, artifact) });
    captures.push({
      viewport: `${viewport.width}x${viewport.height}`,
      artifact,
      observation,
    });
  }
  async function gridLayout({ id, cardPrefix, count, minColumns = 1, maxCardHeight, actionName, label }) {
    const grid = page.locator(`[data-testid="${id}"]:visible`);
    await grid.waitFor();
    await page.waitForFunction(({ id, cardPrefix, count }) => {
      const grid = [...document.querySelectorAll(`[data-testid="${id}"]`)].find((element) => element.getBoundingClientRect().width > 0);
      return grid && [...grid.querySelectorAll(`[data-testid^="${cardPrefix}"]`)].filter((card) => card.getBoundingClientRect().width > 0).length === count;
    }, { id, cardPrefix, count });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const result = await grid.evaluate((element, { cardPrefix, actionName }) => {
      const box = (node) => {
        const { x, y, width, height, right, bottom } = node.getBoundingClientRect();
        return { x, y, width, height, right, bottom };
      };
      const cards = [...element.querySelectorAll(`[data-testid^="${cardPrefix}"]`)].map((card) => {
        const action = actionName && [...card.querySelectorAll('[role="button"]')].find((button) => (button.getAttribute("aria-label") || button.textContent).startsWith(actionName));
        return {
          ...box(card),
          id: card.dataset.testid,
          scale: card.offsetWidth ? card.getBoundingClientRect().width / card.offsetWidth : 1,
          action: action ? box(action) : null,
          actionGroups: [...card.querySelectorAll('[data-testid="compact-actions"]')].map((group) => [...group.querySelectorAll('[role="button"]')].map((button) => ({ ...box(button), label: button.getAttribute("aria-label") || button.textContent }))),
        };
      });
      const rows = [];
      cards.forEach((card) => {
        const row = rows.find((row) => Math.abs(row[0].y - card.y) < 1.5);
        if (row) row.push(card);
        else rows.push([card]);
      });
      const parent = element.parentElement;
      const parentBox = box(parent), style = getComputedStyle(parent);
      const scale = parent.offsetWidth ? parentBox.width / parent.offsetWidth : 1;
      const contentBounds = {
        left: parentBox.x + (parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth)) * scale,
        right: parentBox.right - (parseFloat(style.paddingRight) + parseFloat(style.borderRightWidth)) * scale,
      };
      return { grid: box(element), contentBounds, rows, cards };
    }, { cardPrefix, actionName });
    assert.equal(result.cards.length, count, `${label}: fixtures faltantes`);
    assert.ok(Math.abs(result.grid.x - result.contentBounds.left) <= 1.5 && Math.abs(result.grid.right - result.contentBounds.right) <= 1.5, `${label}: la lista no aprovecha el ancho útil de la pantalla`);
    const columns = Math.max(...result.rows.map((row) => row.length));
    assert.ok(columns >= minColumns, `${label}: sólo ${columns} columnas, se esperaban al menos ${minColumns}`);
    for (const [index, row] of result.rows.entries()) {
      row.sort((a, b) => a.x - b.x);
      assert.ok(Math.abs(row[0].x - result.grid.x) <= 1.5, `${label}: fila ${index + 1} desplazada del borde izquierdo`);
      assert.ok(row.every((card) => Math.abs(card.width - result.cards[0].width) <= 1.5), `${label}: anchos de tarjeta inconsistentes`);
      assert.ok(row.every((card) => Math.abs(card.height - row[0].height) <= 1.5), `${label}: alturas distintas en una fila`);
      assert.ok(row.every((card) => card.right <= result.grid.right + 1.5), `${label}: tarjeta fuera del área útil`);
      if (index < result.rows.length - 1) assert.equal(row.length, columns, `${label}: fila incompleta antes del final`);
      if (row.length === columns) {
        assert.ok(Math.abs(row.at(-1).right - result.grid.right) <= 1.5, `${label}: fila completa deja ${Math.round(result.grid.right - row.at(-1).right)} px sin usar a la derecha`);
      }
      if (actionName) {
        const actions = row.map((card) => card.action);
        assert.ok(actions.every(Boolean), `${label}: acción de tarjeta ausente`);
        assert.ok(actions.every((action) => action.height >= 44), `${label}: área táctil menor a 44 px`);
        assert.ok(actions.every((action) => Math.abs(action.bottom - actions[0].bottom) <= 1.5), `${label}: botones fuera de alineación`);
      }
    }
    if (maxCardHeight) assert.ok(result.cards.every((card) => card.height <= maxCardHeight), `${label}: tarjetas demasiado altas (${Math.round(Math.max(...result.cards.map((card) => card.height)))} px)`);
    if (cardPrefix !== "user-card-") {
      for (const card of result.cards) {
        assert.ok(card.actionGroups.length, `${label}: falta el grupo compacto de acciones en ${card.id}`);
        for (const actions of card.actionGroups) {
          assert.ok(actions.every((action) => Math.abs(action.width - actions[0].width) <= 1.5), `${label}: acciones con títulos distintos usan anchos diferentes en ${card.id}`);
          assert.ok(actions.every((action) => action.width <= 144 * card.scale + 1.5), `${label}: una acción ocupa más de 144 px CSS en ${card.id}`);
        }
      }
    }
    gridEvidence.push({ label, columns, ...result });
    checks.push(`${label}: ${columns} columnas, filas completas ocupan todo el ancho y acciones alineadas${maxCardHeight ? ", densidad compacta" : ""}`);
    return result;
  }
  async function wideLayouts({ id, cardPrefix, count, actionName, maxCardHeight, label, minColumns = 3, capturePrefix = id }) {
    for (const width of [1365, 1536, 1691]) {
      await page.setViewportSize({ width, height: 1000 });
      await overflow(`${label} ${width}`);
      await gridLayout({ id, cardPrefix, count, minColumns, actionName, maxCardHeight, label: `${label} ${width}` });
      await capture(`${capturePrefix}-wide`, "Filas completas ocupan el ancho útil; contenido y acciones compactos.");
    }
    await page.setViewportSize({ width: 1691, height: 1000 });
    await page.evaluate(() => { document.documentElement.style.zoom = "1.25"; });
    try {
      await gridLayout({ id, cardPrefix, count, minColumns: Math.min(minColumns, 2), actionName, maxCardHeight: maxCardHeight ? maxCardHeight * 1.25 : undefined, label: `${label} zoom 125%` });
      await capture(`${capturePrefix}-zoom125`, "Escenario adicional con zoom CSS al 125%; no quedan columnas perdidas por anchos fraccionales.");
    } finally {
      await page.evaluate(() => { document.documentElement.style.zoom = ""; });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  try {
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.getByText("Patio central", { exact: true }).first().waitFor();
    await page
      .getByRole("radio", { name: "Aula 1 · 8 puestos", exact: true })
      .click();
    await page.getByRole("heading", { name: "Aula 1", exact: true }).waitFor();
    await page
      .getByRole("radio", { name: "Patio central · 8 puestos", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Patio central", exact: true })
      .waitFor();
    await capture(
      "spaces",
      "Plano, selección de espacios, menú y cabecera en tema claro; datos locales de prueba.",
    );
    await navigate("Proyectos");
    await page
      .getByRole("button", { name: "Ver proyecto Brazo robótico", exact: true })
      .waitFor();
    await wideLayouts({ id: "projects-grid", cardPrefix: "project-card-", count: projects.length, actionName: "Ver proyecto", maxCardHeight: 500, label: "Proyectos con fotos", capturePrefix: "projects-with-images" });
    mode = "no-images";
    await page.getByRole("button", { name: "Actualizar proyectos", exact: true }).click();
    await page.getByTestId(`project-icon-${projects[0].id}`).waitFor();
    await wideLayouts({ id: "projects-grid", cardPrefix: "project-card-", count: projects.length, actionName: "Ver proyecto", maxCardHeight: 300, label: "Proyectos sin fotos", capturePrefix: "projects-no-images" });
    const icons = await page.locator('[data-testid^="project-icon-"]').evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));
    assert.equal(icons.length, projects.length);
    assert.ok(icons.every((height) => height <= 64), "Los proyectos sin foto reservan un bloque de imagen vacío");
    checks.push("Seis proyectos sin foto usan iconos compactos en lugar de bloques vacíos");
    await page.setViewportSize({ width: 390, height: 844 });
    await overflow("Proyectos sin fotos 390");
    await gridLayout({ id: "projects-grid", cardPrefix: "project-card-", count: projects.length, actionName: "Ver proyecto", maxCardHeight: 360, label: "Proyectos sin fotos móvil" });
    await capture("projects-no-images-mobile", "Proyectos sin foto conservan densidad y acción visible en móvil.");
    mode = "normal";
    await page.getByRole("button", { name: "Actualizar proyectos", exact: true }).click();
    await page.getByTestId(`project-image-${projects[0].id}`).waitFor();
    for (const viewport of targetViewports) {
      const [width, height] = viewport.split("x").map(Number);
      await page.setViewportSize({ width, height });
      await page
        .getByRole("button", {
          name: "Ver proyecto Brazo robótico",
          exact: true,
        })
        .waitFor();
      await overflow(`Proyectos ${viewport}`);
      await capture(
        "responsive",
        "Grilla adaptable y cabecera sin desbordes; datos de prueba y movimiento reducido.",
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .getByRole("button", { name: "Abrir menú de navegación", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Cerrar menú", exact: true })
      .waitFor();
    await page.waitForFunction(
      () =>
        document.activeElement?.getAttribute("aria-label") === "Cerrar menú",
    );
    await capture(
      "mobile-menu",
      "Panel móvil abierto, destino activo y cierre accesible.",
    );
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Cerrar menú", exact: true })
      .waitFor({ state: "hidden" });
    await page
      .getByRole("button", { name: "Activar modo oscuro", exact: true })
      .click();
    const renderedDark = await page.getByTestId(`project-card-${projects[0].id}`).evaluate((card) => {
      const samples = [];
      for (let node = card; node; node = node.parentElement) {
        const color = getComputedStyle(node).backgroundColor;
        if (color !== "rgba(0, 0, 0, 0)" && color !== "transparent") samples.push(color);
      }
      return samples;
    });
    assert.ok(renderedDark.length >= 2, "Modo oscuro: faltan superficies renderizadas para revisar");
    assert.ok(renderedDark.every((color) => {
      const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number);
      return Math.max(...channels) - Math.min(...channels) <= 14;
    }), `Modo oscuro: superficie renderizada con tinte dominante (${renderedDark.join(", ")})`);
    assert.ok(Math.max(...renderedDark[0].match(/[\d.]+/g).slice(0, 3).map(Number)) < 70, "Modo oscuro: las tarjetas siguen claras");
    checks.push("Las superficies renderizadas en modo oscuro también son neutras y oscuras");
    await capture(
      "dark-mobile",
      "Tema oscuro conserva cabeceras, fotos y controles legibles.",
    );
    await page
      .getByRole("button", { name: "Activar modo claro", exact: true })
      .click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await navigate("Inventario");
    await page
      .getByRole("button", {
        name: "Editar Zapatillas eléctricas",
        exact: true,
      })
      .waitFor();
    await wideLayouts({ id: "inventory-grid", cardPrefix: "inventory-card-", count: resources.length, actionName: "Editar", maxCardHeight: 370, label: "Inventario" });
    await page.setViewportSize({ width: 390, height: 844 });
    await overflow("Inventario móvil 390");
    await gridLayout({ id: "inventory-grid", cardPrefix: "inventory-card-", count: resources.length, actionName: "Editar", maxCardHeight: 420, label: "Inventario móvil" });
    await capture("inventory-mobile", "Inventario sin desbordes y acciones alineadas en móvil.");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await capture(
      "inventory",
      "Inventario con controles de edición y baja de ancho compartido.",
    );
    await page
      .getByRole("button", {
        name: "Dar de baja Zapatillas eléctricas",
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await page
      .getByRole("button", {
        name: "Ver historial de Zapatillas eléctricas",
        exact: true,
      })
      .click();
    await page.getByText("Historial del elemento", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Cerrar historial", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Nuevo elemento", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Nombre del elemento", exact: true })
      .fill("Recurso local de prueba");
    await page
      .getByRole("button", { name: "Guardar elemento", exact: true })
      .click();
    await page
      .getByText("El elemento quedó guardado en el inventario compartido.", {
        exact: true,
      })
      .waitFor();
    await navigate("Préstamos");
    await page
      .getByRole("button", {
        name: "Devolver Zapatillas eléctricas de Brazo robótico",
        exact: true,
      })
      .waitFor();
    for (const width of [1440, 1024, 872, 768, 600, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await overflow(`Préstamos ${width}`);
      for (const label of ["Jornada para entregas", "Vista de préstamos"]) {
        const group = page.getByRole("radiogroup", {
          name: label,
          exact: true,
        });
        await page.waitForFunction((label) => {
          const group = [
            ...document.querySelectorAll('[role="radiogroup"]'),
          ].find(
            (element) =>
              element.getAttribute("aria-label") === label &&
              element.getBoundingClientRect().width > 0,
          );
          if (!group) return false;
          const rects = [...group.querySelectorAll('[role="radio"]')].map(
            (element) => element.getBoundingClientRect(),
          );
          return (
            rects.every((rect) => Math.abs(rect.y - rects[0].y) < 1) ||
            rects.every((rect) => Math.abs(rect.x - rects[0].x) < 1)
          );
        }, label);
        const rects = await group.getByRole("radio").evaluateAll((elements) =>
          elements.map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            };
          }),
        );
        assert.equal(rects.length, 3);
        assert.ok(
          rects.every((rect) => Math.abs(rect.width - rects[0].width) < 1),
          `${label}: anchos distintos`,
        );
        const oneRow = rects.every((rect) => Math.abs(rect.y - rects[0].y) < 1);
        const oneColumn = rects.every(
          (rect) => Math.abs(rect.x - rects[0].x) < 1,
        );
        assert.ok(oneRow || oneColumn, `${label}: una opción quedó suelta`);
        if (oneRow)
          assert.ok(
            rects.every((rect) => Math.abs(rect.height - rects[0].height) < 1),
            `${label}: alturas distintas`,
          );
        if (width === 872)
          assert.ok(
            oneRow,
            `${label}: las tres opciones deben compartir fila a 872 px`,
          );
      }
      await capture(
        "loans-aligned",
        "Jornada y vista: tres botones de igual ancho en una fila, o una columna completa en móvil. Sin distribución 2+1.",
      );
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await capture(
      "loans",
      "Fichas de préstamos con títulos de longitudes distintas y acciones al pie.",
    );
    const loanHeadings = await page
      .getByRole("heading")
      .evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect(),
            parent =
              element.parentElement.parentElement.getBoundingClientRect();
          return {
            text: element.textContent,
            right: rect.right,
            parentRight: parent.right,
            scrollWidth: element.scrollWidth,
            width: element.clientWidth,
          };
        }),
      );
    assert.ok(
      loanHeadings.every(
        (item) =>
          item.right <= item.parentRight + 1 &&
          item.scrollWidth <= item.width + 1,
      ),
      "Títulos de préstamos fuera de su tarjeta",
    );
    await navigate("Galería de la ExpoTec");
    await page
      .getByText("Recuerdo de demostración de la exposición.", { exact: true })
      .first()
      .waitFor();
    await capture(
      "gallery",
      "Fotos contenidas en marcos del mismo tamaño; descripción larga conservada.",
    );
    mode = "partial";
    await page
      .getByRole("button", { name: "Actualizar galería", exact: true })
      .click();
    await page
      .getByText(
        "No pudimos cargar esta imagen. Su descripción sigue disponible.",
        { exact: true },
      )
      .waitFor();
    await capture(
      "partial",
      "Una imagen fallida conserva marco y descripción; las demás fotos siguen visibles.",
    );
    await navigate("Usuarios y permisos");
    await page
      .getByRole("button", { name: /^Editar permisos de / }).first()
      .waitFor();
    await wideLayouts({ id: "users-grid", cardPrefix: "user-card-", count: users.length, actionName: "Editar permisos", maxCardHeight: 180, label: "Usuarios", minColumns: 1 });
    const userActions = await page.getByRole("button", { name: /^Editar permisos de / }).evaluateAll((elements) => elements.map((element) => {
      const { width, right } = element.getBoundingClientRect();
      return { width, right };
    }));
    assert.equal(userActions.length, users.length);
    assert.ok(userActions.every((action) => action.width <= 220), "Usuarios: botones innecesariamente anchos");
    assert.ok(userActions.every((action) => Math.abs(action.right - userActions[0].right) <= 1.5), "Usuarios: acciones desalineadas a la derecha");
    await page.setViewportSize({ width: 390, height: 844 });
    await overflow("Usuarios móvil 390");
    await gridLayout({ id: "users-grid", cardPrefix: "user-card-", count: users.length, actionName: "Editar permisos", maxCardHeight: 290, label: "Usuarios móvil" });
    await capture(
      "users",
      "Seis cuentas, nombres y correos largos: filas compactas y botones alineados.",
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    mode = "empty";
    await navigate("Proyectos");
    await page
      .getByText(
        "Todavía no hay proyectos confirmados para la muestra pública.",
        { exact: true },
      )
      .waitFor();
    mode = "error";
    await page
      .getByRole("button", { name: "Actualizar proyectos", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "No pudimos consultar los proyectos." })
      .waitFor();
    mode = "loading";
    await page
      .getByRole("button", { name: "Actualizar proyectos", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Actualizar proyectos", exact: true })
      .isDisabled()
      .then((disabled) => assert.ok(disabled));
    while (!delayRelease) await new Promise((resolve) => setImmediate(resolve));
    mode = "normal";
    delayRelease();
    await page
      .getByRole("button", { name: "Ver proyecto Brazo robótico", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Ver proyecto Brazo robótico", exact: true })
      .focus();
    const focus = await page.evaluate(() => ({
      role: document.activeElement.getAttribute("role"),
      outline: getComputedStyle(document.activeElement).outlineWidth,
    }));
    assert.equal(focus.role, "button");
    assert.ok(parseFloat(focus.outline) >= 3, "Foco de teclado no visible");
    await page.keyboard.press("Enter");
    await page
      .getByRole("heading", { name: "Brazo robótico", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Activar modo oscuro", exact: true })
      .click();
    await capture(
      "dark-desktop",
      "Detalle de proyecto en modo oscuro y navegación conservada.",
    );
    signedIn = false;
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Ingresar", exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Inventario", exact: true })
        .count(),
      0,
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Usuarios y permisos", exact: true })
        .count(),
      0,
    );
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();
    await page.getByText("Iniciá sesión", { exact: true }).waitFor();
    await page.setViewportSize({ width: 320, height: 812 });
    await page
      .getByRole("button", { name: "Ingresar", exact: true })
      .last()
      .click();
    await page
      .getByText("Ingresá un correo válido de hasta 254 caracteres.", {
        exact: true,
      })
      .waitFor();
    await overflow("Cuenta 320x812");
    await capture(
      "account",
      "Formulario de ingreso y validaciones visibles; menú de visitante sin accesos de administración.",
    );
    await page
      .getByRole("button", { name: "Crear una cuenta", exact: true })
      .click();
    await page.getByText("Creá tu cuenta", { exact: true }).waitFor();
    await overflow("Registro 320x812");
    await navigate("Demostración");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole("tab", { name: "Espacios", exact: true }).waitFor();
    await page
      .getByRole("radio", { name: "Aula 1 · 0/8", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("radio", { name: "Aula 1 · 0/8", exact: true })
        .getAttribute("aria-checked"),
      "true",
    );
    await capture(
      "demo-map",
      "Navegación de demostración comparte petróleo y verde; selector local de espacios funciona.",
    );
    await page.getByRole("tab", { name: "Proyectos", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Buscar proyectos", exact: true })
      .waitFor();
    await overflow("Proyectos demo 1440x1000");
    await capture(
      "demo-projects",
      "Tarjetas de la demostración con ilustraciones de categorías y controles compartidos.",
    );
    const switchDemoToLight = page.getByRole("button", { name: "Activar modo claro", exact: true });
    if (await switchDemoToLight.count()) await switchDemoToLight.click();
    await page.setViewportSize({ width: 1536, height: 1000 });
    await gridLayout({ id: "projects-grid", cardPrefix: "project-card-", count: seed.projects.length, minColumns: 3, actionName: "Ver proyecto", maxCardHeight: 420, label: "Proyectos demostración 1536" });
    await capture("demo-projects-compact", "Proyectos de demostración con equipos, sin fotos: densidad compacta y acciones de distintos títulos de ancho común.");
    await page.getByRole("tab", { name: "Inventario", exact: true }).click();
    await page.getByRole("textbox", { name: "Buscar elemento", exact: true }).waitFor();
    await overflow("Inventario demostración 1536");
    await gridLayout({ id: "inventory-grid", cardPrefix: "inventory-card-", count: seed.resources.length, minColumns: 3, actionName: "Editar", maxCardHeight: 330, label: "Inventario demostración 1536" });
    await capture("demo-inventory-compact", "Inventario de demostración: columnas completas y acciones de distintos títulos de ancho común.");
    assert.deepEqual(errors, [], "Errores de React o JavaScript");
    assert.deepEqual(unexpected, [], "Peticiones fuera de las rutas de prueba");
    const report = {
      status: "PASS",
      contract:
        "docs/DISENO_INTERFAZ.md; revisión de Expo Web con fixtures derivados de seed.ts, sin tráfico a TiDB.",
      targetViewports,
      accessibility: {
        status: "pass",
        evidence:
          "Controles de al menos 44 puntos, foco visible de 3 px y activación con Enter; menú móvil cierra con Escape. Contraste semántico revisado por separado.",
      },
      responsive: { status: "pass", evidence: checks.join(". ") },
      contentStates: {
        loading: {
          status: "pass",
          evidence:
            "Consulta retenida: actualizar deshabilitado durante la carga; la respuesta recupera las tarjetas.",
        },
        empty: {
          status: "pass",
          evidence:
            "Consulta vacía muestra el mensaje de muestra sin proyectos confirmados.",
        },
        error: {
          status: "pass",
          evidence:
            "503 controlado muestra aviso y permite recuperar con Actualizar proyectos.",
        },
        partial: {
          status: "pass",
          evidence:
            "Imagen 404 conserva descripción y marco; las otras fotos se muestran.",
        },
        success: {
          status: "pass",
          evidence:
            "Guardar un recurso con API interceptada muestra confirmación y cierra el formulario. Abrir detalle con Enter funciona.",
        },
        permission: {
          status: "pass",
          evidence:
            "Admin de prueba ve gestión; tras recargar como visitante desaparecen Inventario y Usuarios, y se puede abrir ingreso y registro.",
        },
      },
      renderedEvidence: captures,
      checks,
      contrast,
      neutralSurfaces,
      renderedDark,
      gridEvidence,
      runtimeErrors: errors,
    };
    await fs.writeFile(
      path.join(output, "evidence.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(
      JSON.stringify(
        {
          status: "PASS",
          checks: checks.length,
          screenshots: captures.length,
          errors: errors.length,
          output,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await page
      .screenshot({ path: path.join(output, "failure.png") })
      .catch(() => {});
    await fs.writeFile(path.join(output, "evidence.json"), JSON.stringify({
      status: "FAIL",
      error: error.message,
      checks,
      renderedEvidence: captures,
      gridEvidence,
      runtimeErrors: errors,
    }, null, 2));
    throw error;
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
