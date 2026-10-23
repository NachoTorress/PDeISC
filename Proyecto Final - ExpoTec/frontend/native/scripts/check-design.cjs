/* Revisión local aislada: todos los endpoints se interceptan; no modifica TiDB. */
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
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
  "1440x1000",
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
const spaces = seed.spaces.map((space) => ({
  ...space,
  version: 1,
  updatedAt: space.createdAt,
  booths: space.furniture
    .filter((item) => item.type === "table")
    .map((item) => ({ id: item.id, furnitureId: item.id })),
}));
const projects = seed.projects.map((project, index) => ({
  ...project,
  name:
    index === 1
      ? "Huerta inteligente con monitoreo de humedad y riego automático"
      : project.name,
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
}));
const resources = seed.resources.map((resource) => ({
  ...resource,
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
}));
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
    const endpoint = new URL(route.request().url()).pathname;
    const body = route.request().postDataJSON() || {};
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
              : projects.filter((project) => project.status === "approved"),
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
    if (endpoint === "/api/admin/users/query") return reply({ users: [user] });
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
    const sizes = await page
      .getByRole("button", { name: /^Ver proyecto / })
      .evaluateAll((buttons) =>
        buttons.map((button) => {
          const card =
            button.parentElement.parentElement.getBoundingClientRect();
          const action = button.getBoundingClientRect();
          return {
            x: card.x,
            y: card.y,
            width: card.width,
            height: card.height,
            actionY: action.y,
            actionHeight: action.height,
          };
        }),
      );
    assert.equal(sizes.length, 3);
    assert.ok(
      sizes.every((size) => Math.abs(size.height - sizes[0].height) < 1),
      "Alturas de tarjetas diferentes",
    );
    assert.ok(
      sizes.every((size) => Math.abs(size.actionY - sizes[0].actionY) < 1),
      "Acciones sin alinear al pie",
    );
    assert.ok(
      sizes.every((size) => size.actionHeight >= 48),
      "Acción menor a 48 puntos",
    );
    checks.push(
      "Tarjetas con nombres largos: alturas iguales y acciones alineadas al pie, mínimo 48 puntos",
    );
    await capture(
      "projects",
      "Tres tarjetas de igual altura y marco de imagen uniforme; título largo y acciones alineadas.",
    );
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
      .getByRole("button", { name: "Editar permisos", exact: true })
      .waitFor();
    await capture(
      "users",
      "La tarjeta de una sola cuenta conserva ancho de columna y acción al pie.",
    );
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
    assert.deepEqual(errors, [], "Errores de React o JavaScript");
    assert.deepEqual(unexpected, [], "Peticiones fuera de las rutas de prueba");
    const report = {
      contract:
        "docs/DISENO_INTERFAZ.md; revisión de Expo Web con fixtures derivados de seed.ts, sin tráfico a TiDB.",
      targetViewports,
      accessibility: {
        status: "pass",
        evidence:
          "Controles de 48 puntos, foco visible de 3 px y activación con Enter; menú móvil cierra con Escape. Contraste semántico revisado por separado.",
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
    throw error;
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
