/* Recorridos de propuestas contra fixtures locales; ninguna petición llega a producción. */
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { legacyRequest } = require("./legacy-endpoint.cjs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const base = process.env.DESIGN_BASE_URL || "http://127.0.0.1:8097";
const origin = new URL(base).origin;
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error("Esta comprobación sólo admite localhost.");
const output = path.resolve(__dirname, "../../../artifacts/proposal-flow");
const actor = { id: "proposal-actor", firstName: "Ana", lastName: "Prueba", email: "ana@example.invalid", roles: ["student"], active: true, createdAt: "2026-10-23" };
const pupil = { id: "proposal-pupil", firstName: "Bruno", lastName: "Prueba" };
const teacher = { id: "proposal-teacher", firstName: "Clara", lastName: "Docente" };
const creator = { id: "proposal-creator", firstName: "Diana", lastName: "Autora" };
const photo = "https://photo-fixture.invalid/project.jpg";
const space = { id: "proposal-space", name: "Patio de prueba", description: "Espacio ficticio local", createdAt: "2026-10-23", updatedAt: "2026-10-23", version: 1, furniture: [{ id: "M01", type: "table", x: 30, y: 30, rotation: 0 }], booths: [{ id: "proposal-booth", furnitureId: "M01" }] };
const resource = { id: "proposal-resource", name: "Proyector", description: "Fixture local", total: 6, reserved: 0, available: 6, unavailable: 0, outstanding: 0, availableToLend: 6, shortage: 0, version: 1, createdAt: "2026-10-23", updatedAt: "2026-10-23", archivedAt: null };
const fields = { name: "Huerta de prueba", description: "Este proyecto ficticio permite comprobar el recorrido completo sin guardar datos reales.", course: "6° 1° · Informática", imageUrl: photo, videoUrl: "https://video-fixture.invalid/demo.mp4", isSoftwareProject: true, githubUrl: "https://github.com/equipo/prueba", websiteUrl: "https://project-fixture.invalid/" };
const initialProject = { id: "proposal-project", ...fields, name: "Propuesta para corregir", createdAt: "2026-10-23", status: "changes", creatorId: creator.id, members: [creator, actor, pupil], teachers: [teacher], subjects: ["Programación"], version: 7, feedback: "Aclarar cómo se usa el sensor y conservar los integrantes del equipo.", booth: { id: "proposal-booth", spaceId: space.id, spaceName: space.name, furnitureId: "M01" }, resources: [{ resourceId: resource.id, name: resource.name, quantity: 2, reservedQuantity: 0, total: 6, available: 6, archivedAt: null, unavailable: 0, outstanding: 0 }], reviews: [] };

async function run() {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
  const checks = [], screenshots = [], runtimeErrors = [], unexpectedRequests = [], submissions = [];
  let activePage, activeWidth;
  const record = (name, details = {}) => checks.push({ name, ...details });
  try {
    for (const width of [390, 1440, 320, 768]) {
      activeWidth = width;
      const context = await browser.newContext({ viewport: { width, height: width >= 768 ? 1050 : 844 }, colorScheme: width === 390 ? "dark" : "light", reducedMotion: "reduce" });
      const page = await context.newPage();
      activePage = page;
      page.setDefaultTimeout(12000);
      const state = { failSpaces: 0, lookups: [], releases: {}, submitMode: "success", project: structuredClone(initialProject), boothQueries: 0, prepared: 0, completed: 0 };
      page.on("pageerror", (error) => runtimeErrors.push({ width, message: error.message }));
      await context.route("**/*", async (route) => {
        if (route.request().url() === photo) {
          const image = await fs.readFile(path.resolve(__dirname, "../assets/demo-gallery/robot.jpg"));
          return route.fulfill({ contentType: "image/jpeg", body: image });
        }
        if (route.request().url() === fields.videoUrl) return route.fulfill({ contentType: "video/mp4", body: Buffer.alloc(0) });
        if (new URL(route.request().url()).origin === origin) return route.continue();
        unexpectedRequests.push(route.request().url());
        return route.abort();
      });
      await context.route("**/api/**", async (route) => {
        const { endpoint, body } = legacyRequest(route.request());
        const reply = (value, status = 200) => route.fulfill({ status, contentType: "application/json", headers: { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "POST, OPTIONS" }, body: JSON.stringify(value) });
        const error = (message, status, fields = {}) => reply({ error: { message, fields } }, status);
        if (route.request().method() === "OPTIONS") return reply({});
        if (endpoint.endsWith("/browser/refresh")) return reply({ user: actor, accessToken: "local-proposal-fixture", expiresIn: 3600 });
        if (endpoint === "/api/auth/session") return reply({ user: actor });
        if (endpoint === "/api/auth/recovery/query") return reply({ enabled: false });
        if (endpoint === "/api/auth/social/providers/query") return reply({ providers: [] });
        if (endpoint === "/api/spaces/query") {
          if (state.failSpaces-- > 0) return error("No pudimos cargar los espacios de prueba.", 503);
          return reply({ spaces: [{ ...space, furnitureCount: 1, boothCount: 1 }] });
        }
        if (endpoint === `/api/spaces/${space.id}/query`) {
          state.boothQueries++;
          return reply({ space });
        }
        if (endpoint === "/api/inventory/catalog/query") return reply({ resources: [resource] });
        if (endpoint === "/api/projects/public/query" || endpoint === "/api/projects/query") return reply({ projects: body.offset ? [] : [{ ...state.project, spaceName: space.name, furnitureId: "M01" }] });
        if (endpoint === `/api/projects/${state.project.id}/query` || endpoint === `/api/projects/public/${state.project.id}/query`) return reply({ project: state.project });
        if (endpoint === "/api/projects/people/find") {
          state.lookups.push(body);
          if (body.email === "slow@example.invalid") await new Promise((resolve) => { state.releases.people = resolve; });
          const person = body.email === actor.email ? actor : body.email === "bruno@example.invalid" || body.email === "slow@example.invalid" ? pupil : body.email === "clara@example.invalid" ? teacher : undefined;
          return person ? reply({ person }) : error("Cuenta no encontrada.", 404);
        }
        if (endpoint === "/api/uploads/prepare") {
          state.prepared++;
          await new Promise((resolve) => { state.releases.photo = resolve; });
          return reply({ id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", pathname: "local-fixture.jpg", clientToken: "local-unused-fixture" });
        }
        if (endpoint === "/api/uploads/complete") { state.completed++; return error("No debe completarse una carga cancelada.", 400); }
        if (endpoint === "/api/projects/create" || endpoint === `/api/projects/${state.project.id}/save`) {
          submissions.push({ width, endpoint, body: structuredClone(body), outcome: state.submitMode });
          if (state.submitMode === "field") return error("Revisá la materia indicada por el servidor.", 422, { subjects: "La materia de prueba necesita una corrección." });
          if (state.submitMode === "conflict") return error("El puesto cambió mientras editabas.", 409);
          state.project = { ...state.project, ...body, status: "pending", members: body.memberIds.map((id) => [actor, creator, pupil].find((person) => person.id === id)), teachers: body.teacherIds.map(() => teacher), resources: body.resources.map((item) => ({ ...initialProject.resources[0], ...item })), version: (body.version || 0) + 1, feedback: "" };
          return reply({ project: state.project });
        }
        unexpectedRequests.push(endpoint);
        return error("Ruta ajena a la comprobación aislada.", 400);
      });

      const button = (name, scope = page) => scope.getByRole("button", { name, exact: true });
      const input = (name, scope = page) => scope.getByRole("textbox", { name, exact: true });
      const visibleStep = (key) => page.locator(`[data-testid="proposal-step-${key}"]:visible`);
      async function step(key) { await visibleStep(key).waitFor(); }
      async function navigate(label) {
        // Espera a que cargue la barra: en teléfonos hay menú hamburguesa; en escritorio, menú fijo.
        const menu = button("Abrir menú de navegación");
        await menu.or(button(label)).first().waitFor();
        if (await menu.isVisible()) await menu.click();
        await button(label).click();
      }
      async function capture(label) {
        await page.evaluate(() => {
          const steps = [...document.querySelectorAll('[data-testid="proposal-steps"]')].find((element) => element.getClientRects().length);
          for (let element = steps; element; element = element.parentElement) {
            if (/auto|scroll/.test(getComputedStyle(element).overflowY)) element.scrollTop = 0;
          }
        });
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const artifact = `${label}-${width}.png`;
        await page.screenshot({ path: path.join(output, artifact) });
        screenshots.push({ width, artifact });
      }
      async function captureWholeTeam() {
        const viewport = page.viewportSize();
        const bounds = await visibleStep("team").boundingBox();
        await page.setViewportSize({ width, height: Math.ceil(bounds.height + 650) });
        await capture("create-team-complete");
        await page.setViewportSize(viewport);
      }
      async function overflow(label) {
        const outside = await page.evaluate(() => {
          const width = document.documentElement.clientWidth;
          return [...document.querySelectorAll('[data-testid^="proposal-step-"] [role="button"],[data-testid^="proposal-step-"] input,[data-testid^="proposal-step-"] textarea,[data-testid="proposal-steps"] [role="button"]')]
            .filter((element) => element.getClientRects().length)
            .map((element) => ({ label: element.getAttribute("aria-label") || element.textContent, rect: element.getBoundingClientRect() }))
            .filter(({ rect }) => rect.width > 0 && (rect.left < -1.5 || rect.right > width + 1.5))
            .map(({ label, rect }) => ({ label, x: rect.x, width: rect.width }));
        });
        assert.deepEqual(outside, [], `${width}px ${label}: desborde horizontal`);
        record(`${width}px ${label}: sin desbordes`);
      }
      async function details(optional = false) {
        await input("Nombre del proyecto").fill(fields.name);
        await input("Descripción del proyecto").fill(fields.description);
        await input("Curso y especialidad").fill(fields.course);
        if (!(await input("Enlace HTTPS de la foto").isVisible())) await button("Usar un enlace").click();
        await input("Enlace HTTPS de la foto").fill(photo);
        if (optional) {
          await button("Agregar video o enlaces (opcional)").click();
          await input("Enlace al video (opcional)").fill(fields.videoUrl);
          await page.getByRole("checkbox", { name: "Proyecto informático", exact: true }).click();
          await input("Repositorio de GitHub (opcional)").fill(fields.githubUrl);
          await input("Página del proyecto (opcional)").fill(fields.websiteUrl);
        }
      }
      async function find(role, email, enter = false) {
        const picker = page.getByTestId(`project-people-${role}`);
        await input(role === "student" ? "Correo del alumno" : "Correo del profesor", picker).fill(email);
        if (enter) await input(role === "student" ? "Correo del alumno" : "Correo del profesor", picker).press("Enter");
        else await button(role === "student" ? "Buscar alumno" : "Buscar profesor", picker).click();
        return picker;
      }
      async function addTeacher() {
        const picker = await find("teacher", "clara@example.invalid");
        await picker.getByTestId("person-search-result-teacher").waitFor();
        await button("Agregar profesor responsable", picker).click();
      }
      async function selectPlace(withResources = false) {
        await page.getByRole("radio", { name: "Puesto M01", exact: true }).click();
        if (withResources) {
          await button("¿Necesitan elementos de la escuela? (opcional)").click();
          await button("Agregar Proyector · 6 disponibles").click();
          await input("Cantidad de Proyector").fill("2");
        }
      }
      async function next() { await button("Continuar").click(); }
      await page.goto(base);
      await navigate("Proyectos");
      await button("Presentar proyecto").waitFor();

      if (width === 1440) {
        await page.getByRole("radio", { name: "Mis proyectos y revisiones", exact: true }).click();
        await button(`Ver proyecto ${initialProject.name}`).click();
        await button("Editar y reenviar propuesta").click();
        await step("project");
        await page.getByText(initialProject.feedback, { exact: true }).last().waitFor();
        assert.equal(await input("Nombre del proyecto").inputValue(), initialProject.name);
        await input("Nombre del proyecto").fill("Propuesta corregida localmente");
        await overflow("edición datos");
        await capture("edit-project");
        await next(); await step("team");
        assert.equal(await button(`Quitar a ${actor.firstName} ${actor.lastName}`).count(), 0);
        assert.equal(await button(`Quitar a ${creator.firstName} ${creator.lastName}`).count(), 0);
        await page.getByTestId(`selected-person-student-${creator.id}`).getByText("Autor del proyecto · permanece en el equipo").waitFor();
        await button(`Quitar a ${pupil.firstName} ${pupil.lastName}`).click();
        await button("Cancelar", page.getByTestId(`selected-person-student-${pupil.id}`)).click();
        assert.equal(await page.getByTestId(`selected-person-student-${pupil.id}`).count(), 1);
        record("1440px edición: feedback, creador y editor protegidos; quitar participante permite cancelar");
        await next(); await step("place");
        assert.equal(await input("Cantidad de Proyector").inputValue(), "2");
        await button("Revisar propuesta").click(); await step("review");
        state.submitMode = "conflict";
        await button("Guardar y reenviar").click();
        await page.getByText(/Tu borrador se conserva/).waitFor();
        await button("Recargar propuesta guardada").click();
        await button("Cancelar").click();
        await button("Revisar puesto y elementos").click(); await step("place");
        const queries = state.boothQueries;
        const refreshed = page.waitForResponse((response) => legacyRequest(response.request()).endpoint === `/api/spaces/${space.id}/query`);
        await button("Actualizar puestos").click();
        await refreshed;
        assert.ok(state.boothQueries > queries);
        assert.equal(await input("Cantidad de Proyector").inputValue(), "2");
        await button("Paso 1: Proyecto").click();
        assert.equal(await input("Nombre del proyecto").inputValue(), "Propuesta corregida localmente");
        await button("Paso 4: Revisar").click(); await step("review");
        await overflow("edición resumen"); await capture("edit-review");
        state.submitMode = "success";
        await button("Guardar y reenviar").click();
        await button("Editar y reenviar propuesta").waitFor();
        const sent = submissions.at(-1);
        assert.equal(sent.body.version, 7);
        assert.deepEqual(sent.body.memberIds, [creator.id, actor.id, pupil.id]);
        assert.deepEqual(sent.body.resources, [{ resourceId: resource.id, quantity: 2 }]);
        assert.equal(sent.body.name, "Propuesta corregida localmente");
        record("1440px edición: conflicto 409 conserva borrador, cancelar recarga, actualizar puestos y reenviar versión original");
        await context.close();
        continue;
      }

      if (width === 390) state.failSpaces = 1;
      await button("Presentar proyecto").click();
      if (width === 390) {
        await button("Reintentar carga").click();
        record("390px alta: falla inicial recuperable sin salir del formulario");
      }
      await step("project");
      if (width === 390) {
        await next();
        await page.getByTestId("proposal-step-errors").waitFor();
        assert.equal(submissions.length, 0);
        await overflow("datos con errores");
        const chooser = page.waitForEvent("filechooser");
        const preparing = page.waitForRequest((request) => legacyRequest(request).endpoint === "/api/uploads/prepare");
        await button("Elegir foto").click();
        await (await chooser).setFiles(path.resolve(__dirname, "../assets/demo-gallery/robot.jpg"));
        await button("Cancelar carga").waitFor();
        await preparing;
        assert.equal(await button("Cancelar carga").isEnabled(), true);
        await button("Cancelar carga").click();
        state.releases.photo();
        await button("Elegir foto").waitFor();
        assert.equal(state.prepared, 1); assert.equal(state.completed, 0);
        record("390px foto: cancelar funciona dentro del formulario y evita completar o subir el archivo");
      }
      await details(width === 390);
      await overflow("alta datos"); await capture("create-project");
      await next(); await step("team");
      const students = page.getByTestId("project-people-student"), teachers = page.getByTestId("project-people-teacher"), subjects = page.getByTestId("project-subjects-picker");
      if (width === 390) {
        const before = state.lookups.length;
        await find("teacher", "correo-sin-arroba");
        await teachers.getByText("Escribí el correo completo con el que esta persona ingresa a ExpoTec.", { exact: true }).waitFor();
        assert.equal(state.lookups.length, before);
        await find("teacher", "ausente@example.invalid");
        await teachers.getByText(/No encontramos un profesor/).waitFor();
        await addTeacher();
        assert.equal(await teachers.getByTestId(`selected-person-teacher-${teacher.id}`).count(), 1);
        await find("teacher", actor.email);
        await teachers.getByText(/No puede ocupar ambos roles/).waitFor();
        await button("Limpiar correo", teachers).click();
        await find("student", " BRUNO@EXAMPLE.INVALID ", true);
        await students.getByTestId("person-search-result-student").waitFor();
        assert.equal(await students.getByTestId(`selected-person-student-${pupil.id}`).count(), 0);
        await next(); await step("team");
        await page.getByTestId("proposal-step-errors").getByText(/alumno sin agregar/).waitFor();
        await button("Anterior").click(); await step("project");
        assert.equal(await input("Nombre del proyecto").inputValue(), fields.name);
        await next(); await step("team");
        await students.getByTestId("person-search-result-student").waitFor();
        await button("Agregar al equipo", students).click();
        assert.equal(await students.getByTestId(`selected-person-student-${pupil.id}`).count(), 1);
        for (const email of [actor.email, "bruno@example.invalid"]) {
          await find("student", email);
          await students.getByText(/ya está agregado|ya forma parte|ya está en/).first().waitFor();
          assert.equal(await students.getByTestId("person-search-result-student").count(), 0);
          await button("Limpiar correo", students).click();
        }
        const slowRequest = page.waitForRequest((request) => legacyRequest(request).endpoint === "/api/projects/people/find" && legacyRequest(request).body.email === "slow@example.invalid");
        await find("student", "slow@example.invalid");
        await slowRequest;
        await button("Cancelar búsqueda", students).click();
        const slowResponse = page.waitForResponse((response) => legacyRequest(response.request()).endpoint === "/api/projects/people/find");
        state.releases.people();
        await slowResponse;
        assert.equal(await input("Correo del alumno", students).inputValue(), "");
        assert.equal(await students.getByTestId("person-search-result-student").count(), 0);
        record("390px personas: correo inválido no consulta; 404 recuperable; búsqueda separada de agregar; pendientes persisten; duplicados y respuestas canceladas descartados");
      } else await addTeacher();

      await input("Agregar una materia", subjects).fill("Programación");
      await input("Agregar una materia", subjects).press("Enter");
      await button("Quitar materia Programación", subjects).waitFor();
      if (width === 390) {
        await input("Agregar una materia", subjects).fill("programacion");
        await subjects.getByText("Esa materia ya está agregada.", { exact: true }).waitFor();
        await button("Limpiar texto", subjects).click();
        await button("Agregar materia Física", subjects).click();
        await input("Agregar una materia", subjects).fill("Materia pendiente");
        await button("Volver sin enviar").click();
        await button("Descartar y salir").waitFor();
        await button("Cancelar").click();
        assert.equal(await input("Agregar una materia", subjects).inputValue(), "Materia pendiente");
        await next(); await step("team");
        await page.getByTestId("proposal-step-errors").getByText(/materia escrita todavía/).waitFor();
        await button("Anterior").click(); await step("project");
        await next(); await step("team");
        assert.equal(await input("Agregar una materia", subjects).inputValue(), "Materia pendiente");
        await button("Limpiar texto", subjects).click();
        await button("Quitar materia Física", subjects).click();
        await button("Cancelar", subjects).click();
        assert.equal(await button("Quitar materia Física", subjects).count(), 1);
        record("390px materias: Enter, sugerencia, duplicados sin tildes, pendientes bloquean avance y sobreviven a Anterior; quitar se puede cancelar");
      }
      await overflow("equipo y materias"); await capture("create-team");
      if (width === 390) await captureWholeTeam();
      await next(); await step("place"); await selectPlace(width === 390);
      if (width === 390) {
        await button("Ocultar elementos solicitados").click();
        await button("Ver elementos solicitados (1)").click();
        assert.equal(await input("Cantidad de Proyector").inputValue(), "2");
      }
      await overflow("puesto y elementos"); await capture("create-place");
      await button("Revisar propuesta").click(); await step("review");
      await page.getByTestId("proposal-review").getByText(fields.name, { exact: true }).waitFor();
      await overflow("resumen"); await capture("create-review");
      if (width === 390) {
        state.submitMode = "field";
        await button("Enviar propuesta").click(); await step("team");
        await page.getByTestId("proposal-step-errors").getByText(/materia de prueba necesita/).waitFor();
        await input("Agregar una materia", subjects).fill("Taller de sensores");
        await input("Agregar una materia", subjects).press("Enter");
        await button("Paso 4: Revisar").click(); await step("review");
        state.submitMode = "success";
        await button("Enviar propuesta").click();
        await button("Editar y reenviar propuesta").waitFor();
        const sent = submissions.at(-1);
        assert.deepEqual(sent.body, { ...fields, memberIds: [actor.id, pupil.id], teacherIds: [teacher.id], subjects: ["Programación", "Física", "Taller de sensores"], boothId: "proposal-booth", resources: [{ resourceId: resource.id, quantity: 2 }] });
        assert.equal(state.lookups.find((lookup) => lookup.role === "student").email, "bruno@example.invalid");
        record("390px alta: resumen completo; errores de servidor vuelven al paso adecuado; payload íntegro sin nombres/correos ni campos extra");
      } else record(`${width}px alta: cuatro pasos completos sin desbordes, validación y selección operables`);
      await context.close();
    }
    assert.deepEqual(runtimeErrors, [], "Errores de ejecución del navegador");
    assert.deepEqual(unexpectedRequests, [], "Peticiones inesperadas o externas");
    await fs.writeFile(path.join(output, "report.json"), JSON.stringify({ status: "PASS", checks, screenshots, runtimeErrors, unexpectedRequests, submissions }, null, 2));
    console.log(JSON.stringify({ status: "PASS", checks: checks.length, screenshots: screenshots.length, submissions: submissions.length, report: path.join(output, "report.json") }));
  } catch (error) {
    if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: path.join(output, `failure-${activeWidth}.png`) }).catch(() => {});
    if (activePage && !activePage.isClosed()) await fs.writeFile(path.join(output, `failure-dom-${activeWidth}.txt`), await activePage.locator("body").innerText()).catch(() => {});
    await fs.writeFile(path.join(output, "report.json"), JSON.stringify({ status: "FAIL", error: error.stack, checks, screenshots, runtimeErrors, unexpectedRequests, submissions }, null, 2));
    throw error;
  } finally { await browser.close(); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
