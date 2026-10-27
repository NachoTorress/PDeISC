/** Pruebas unitarias de `model.ts` (se ejecutan con `npm test` usando node:test y tsx). */
import assert from "node:assert/strict";
import test from "node:test";
import { applyMutation, resourceOut, resourceUsed } from "./model";
import { seed } from "./seed";
import { resizeTable, type ResizeHandle } from "./resizeTable";
import { projectLinkError, safeProjectLink } from "./projectLinks";
import {
  isProjectMember,
  memberKey,
  memberNameError,
  migrateProjectTeams,
  projectMembers,
  teamErrors,
} from "./team";
import type { DemoState, Furniture, Project } from "./types";

const fresh = () => structuredClone(seed);
const pending = (state: DemoState) =>
  state.projects.find((project) => project.id === "weather")!;
const image = "data:image/png;base64,aGVsbG8=";

test("los enlaces opcionales aceptan HTTP(S) y GitHub exige el host exacto y un repositorio", () => {
  for (const value of [undefined, "", "   "]) {
    assert.equal(projectLinkError(value, "github"), "");
    assert.equal(projectLinkError(value, "website"), "");
    assert.equal(safeProjectLink(value, "website"), "");
  }
  for (const value of [
    "https://github.com/escuela/proyecto",
    "https://www.github.com/escuela/proyecto.git",
    "http://github.com/escuela/proyecto/tree/main/src",
  ]) {
    assert.equal(projectLinkError(value, "github"), "");
    assert.equal(safeProjectLink(`  ${value}  `, "github"), value);
  }
  const demo = "http://localhost:8080/mi-proyecto?modo=demo#inicio";
  assert.equal(projectLinkError(demo, "website"), "");
  assert.equal(safeProjectLink(demo, "website"), demo);
});

test("los enlaces rechazan protocolos, rutas relativas, credenciales y datos mal formados", () => {
  for (const kind of ["github", "website"] as const) {
    for (const value of [
      null,
      123,
      true,
      {},
      "/proyecto",
      "//github.com/escuela/proyecto",
      "javascript:alert(1)",
      "data:text/html,contenido",
      "ftp://github.com/escuela/proyecto",
      "https://github.com/escuela/mi proyecto",
      "https://github.com/escuela/proy\necto",
      "https://github.com/escuela/proy\u0000ecto",
      "https://usuario:clave@github.com/escuela/proyecto",
      "https://token@github.com/escuela/proyecto",
      `https://github.com/escuela/${"a".repeat(2048)}`,
    ]) {
      assert.notEqual(projectLinkError(value, kind), "", String(value));
      assert.equal(safeProjectLink(value, kind), "", String(value));
    }
  }
  for (const value of [
    "https://github.com.ejemplo.com/escuela/proyecto",
    "https://evilgithub.com/escuela/proyecto",
    "https://gitlab.com/escuela/proyecto",
    "https://github.com",
    "https://github.com/escuela",
    "https://github.com/escuela/",
    "https://github.com//proyecto",
  ]) {
    assert.notEqual(projectLinkError(value, "github"), "", value);
    assert.equal(safeProjectLink(value, "github"), "", value);
  }
});

test("crear y editar un proyecto informático persiste los enlaces sin alterar datos del equipo", () => {
  const state = fresh();
  const project: Project = {
    ...pending(state),
    id: "informatico",
    furnitureId: "P02",
    image,
    isSoftwareProject: true,
    githubUrl: "  https://github.com/escuela/expotec/tree/main  ",
    websiteUrl: "  https://expotec.ejemplo.com/demo?curso=7#proyecto  ",
  };
  const original = structuredClone(project);
  const next = applyMutation(
    state,
    { type: "saveProject", project },
    "student",
  );
  const saved = next.projects.at(-1)!;
  assert.equal(saved.isSoftwareProject, true);
  assert.equal(saved.githubUrl, project.githubUrl!.trim());
  assert.equal(saved.websiteUrl, project.websiteUrl!.trim());
  const edited = applyMutation(
    next,
    {
      type: "saveProject",
      project: {
        ...saved,
        githubUrl: "https://github.com/escuela/expotec-v2",
        websiteUrl: "http://localhost:5173/proyecto",
        createdAt: "2000-01-01",
      },
    },
    "student",
  ).projects.at(-1)!;
  assert.equal(edited.githubUrl, "https://github.com/escuela/expotec-v2");
  assert.equal(edited.websiteUrl, "http://localhost:5173/proyecto");
  assert.equal(edited.createdAt, original.createdAt);
  assert.equal(edited.student, original.student);
  assert.deepEqual(edited.members, original.members);
  assert.equal(edited.spaceId, original.spaceId);
  assert.equal(edited.furnitureId, original.furnitureId);
  assert.deepEqual(project, original);
});

test("los proyectos anteriores y los informáticos sin enlaces siguen pudiendo guardarse", () => {
  const state = fresh();
  for (const isSoftwareProject of [undefined, false, true]) {
    const project = { ...pending(state), isSoftwareProject };
    const next = applyMutation(
      state,
      { type: "saveProject", project },
      "student",
    );
    assert.equal(pending(next).isSoftwareProject, isSoftwareProject ?? false);
    assert.equal(pending(next).githubUrl, "");
    assert.equal(pending(next).websiteUrl, "");
  }
});

test("los enlaces y la opción informática se validan antes de modificar el estado", () => {
  const state = fresh();
  const snapshot = structuredClone(state);
  const project = pending(state);
  const invalid: Partial<Project>[] = [
    { isSoftwareProject: "sí" as unknown as boolean },
    { isSoftwareProject: true, githubUrl: "javascript:alert(1)" },
    { isSoftwareProject: true, websiteUrl: "/relativa" },
    {
      isSoftwareProject: false,
      githubUrl: "https://github.com/escuela/proyecto",
    },
    { websiteUrl: "https://proyecto.ejemplo.com" },
    { isSoftwareProject: false, websiteUrl: 123 as unknown as string },
    {
      isSoftwareProject: false,
      githubUrl: "https://gitlab.com/escuela/proyecto",
    },
  ];
  for (const changes of invalid) {
    assert.throws(() =>
      applyMutation(
        state,
        { type: "saveProject", project: { ...project, ...changes } },
        "student",
      ),
    );
    assert.deepEqual(state, snapshot);
  }
});

const drawingStage = { width: 1000, height: 600 };
const drawingTable: Furniture = {
  id: "mesa",
  type: "table",
  x: 50,
  y: 50,
  rotation: 0,
  width: 14,
  height: 9,
};
const near = (actual: number, expected: number) =>
  assert.ok(
    Math.abs(actual - expected) < 1e-7,
    `${actual} debe aproximarse a ${expected}`,
  );

function oppositeAnchor(item: Furniture, handle: ResizeHandle) {
  const angle = (item.rotation * Math.PI) / 180;
  const x = handle.includes("e") ? -1 : handle.includes("w") ? 1 : 0;
  const y = handle.includes("s") ? -1 : handle.includes("n") ? 1 : 0;
  const localX = (x * item.width! * drawingStage.width) / 200;
  const localY = (y * item.height! * drawingStage.height) / 200;
  return {
    x:
      (item.x * drawingStage.width) / 100 +
      localX * Math.cos(angle) -
      localY * Math.sin(angle),
    y:
      (item.y * drawingStage.height) / 100 +
      localX * Math.sin(angle) +
      localY * Math.cos(angle),
  };
}

test("redimensionar desde un borde agranda o achica manteniendo inmóvil el borde opuesto", () => {
  for (const [handle, dx, expectedWidth] of [
    ["e", 60, 20],
    ["w", 40, 10],
    ["e", -60, 8],
    ["w", -60, 20],
  ] as const) {
    const snapshot = structuredClone(drawingTable);
    const next = {
      ...drawingTable,
      ...resizeTable(drawingTable, handle, dx, 0, drawingStage),
    };
    near(next.width, expectedWidth);
    near(next.height, 9);
    near(
      oppositeAnchor(next, handle).x,
      oppositeAnchor(drawingTable, handle).x,
    );
    near(
      oppositeAnchor(next, handle).y,
      oppositeAnchor(drawingTable, handle).y,
    );
    assert.deepEqual(drawingTable, snapshot);
  }
});

test("los lados modifican únicamente su eje y las esquinas conservan su ancla", () => {
  const north = resizeTable(drawingTable, "n", 100, -30, drawingStage);
  near(north.width, 14);
  near(north.height, 14);
  near(north.x, 50);
  const east = resizeTable(drawingTable, "e", 30, -100, drawingStage);
  near(east.height, 9);
  near(east.y, 50);
  for (const handle of ["ne", "se", "sw", "nw"] as const) {
    const next = {
      ...drawingTable,
      ...resizeTable(drawingTable, handle, 30, -24, drawingStage),
    };
    near(
      oppositeAnchor(next, handle).x,
      oppositeAnchor(drawingTable, handle).x,
    );
    near(
      oppositeAnchor(next, handle).y,
      oppositeAnchor(drawingTable, handle).y,
    );
    assert.notEqual(next.width, drawingTable.width);
    assert.notEqual(next.height, drawingTable.height);
  }
});

test("una mesa girada interpreta el arrastre en sus ejes y conserva el ancla en un plano rectangular", () => {
  const rotated = { ...drawingTable, rotation: 90 };
  const next = {
    ...rotated,
    ...resizeTable(rotated, "e", 40, 60, drawingStage),
  };
  near(next.width, 20);
  near(next.height, 9);
  near(next.x, 50);
  near(next.y, 55);
  near(oppositeAnchor(next, "e").x, oppositeAnchor(rotated, "e").x);
  near(oppositeAnchor(next, "e").y, oppositeAnchor(rotated, "e").y);
  for (const rotation of [0, 90, 180, 270, 35]) {
    const item = { ...drawingTable, rotation };
    const resized = {
      ...item,
      ...resizeTable(item, "nw", -20, -15, drawingStage),
    };
    near(oppositeAnchor(resized, "nw").x, oppositeAnchor(item, "nw").x);
    near(oppositeAnchor(resized, "nw").y, oppositeAnchor(item, "nw").y);
  }
});

test("redimensionar respeta tamaños mínimos y máximos aunque el puntero cruce el borde opuesto", () => {
  const smallest = resizeTable(drawingTable, "se", -5000, -5000, drawingStage);
  near(smallest.width, 6);
  near(smallest.height, 4);
  const largest = resizeTable(drawingTable, "se", 5000, 5000, drawingStage);
  near(largest.width, 30);
  near(largest.height, 25);
  for (const geometry of [smallest, largest]) {
    const next = { ...drawingTable, ...geometry };
    near(oppositeAnchor(next, "se").x, oppositeAnchor(drawingTable, "se").x);
    near(oppositeAnchor(next, "se").y, oppositeAnchor(drawingTable, "se").y);
  }
});

test("el límite del plano detiene el crecimiento sin recortar la mesa ni desplazar el ancla", () => {
  const original = { ...drawingTable, x: 89 };
  const next = {
    ...original,
    ...resizeTable(original, "e", 1000, 0, drawingStage),
  };
  near(next.width, 17.8);
  near(
    (next.x * drawingStage.width) / 100 +
      (next.width * drawingStage.width) / 200,
    998,
  );
  near(oppositeAnchor(next, "e").x, oppositeAnchor(original, "e").x);

  const rotated = { ...drawingTable, rotation: 90, y: 85 };
  const limited = {
    ...rotated,
    ...resizeTable(rotated, "e", 0, 1000, drawingStage),
  };
  near(limited.width, 15.8);
  near(
    (limited.y * drawingStage.height) / 100 +
      (limited.width * drawingStage.width) / 200,
    598,
  );
  near(oppositeAnchor(limited, "e").y, oppositeAnchor(rotated, "e").y);
});

test("la geometría anterior y los tamaños de pantalla inválidos no generan valores no finitos", () => {
  const legacy = { ...drawingTable, width: undefined, height: undefined };
  for (const stage of [
    { width: 0, height: 600 },
    { width: 1000, height: 0 },
    { width: NaN, height: 600 },
    { width: 1000, height: Infinity },
  ]) {
    assert.deepEqual(resizeTable(legacy, "se", 20, 20, stage), {
      x: 50,
      y: 50,
      width: 14,
      height: 9,
    });
  }
  assert.deepEqual(resizeTable(legacy, "e", NaN, Infinity, drawingStage), {
    x: 50,
    y: 50,
    width: 14,
    height: 9,
  });
});

test("guardar un redimensionado persiste tamaño y centro sin alterar proyectos asignados", () => {
  const state = fresh();
  const snapshot = structuredClone(state);
  const space = structuredClone(state.spaces[0]);
  const index = space.furniture.findIndex((item) => item.id === "P01");
  const table = space.furniture[index];
  const resized = resizeTable(table, "se", -30, -12, drawingStage);
  space.furniture[index] = { ...table, ...resized };
  const next = applyMutation(state, { type: "saveSpace", space }, "admin");
  assert.deepEqual(next.spaces[0].furniture[index], { ...table, ...resized });
  assert.notEqual(resized.x, table.x);
  assert.notEqual(resized.y, table.y);
  assert.deepEqual(next.projects, state.projects);
  assert.deepEqual(next.loans, state.loans);
  assert.deepEqual(state, snapshot);
});

test("aprobar reserva los recursos y rechaza una mesa ocupada", () => {
  const state = fresh();
  pending(state).furnitureId = "P01";
  assert.throws(
    () =>
      applyMutation(
        state,
        { type: "review", id: "weather", action: "approve" },
        "teacher",
      ),
    /mesa ya está ocupada/,
  );
  pending(state).furnitureId = "P03";
  const next = applyMutation(
    state,
    { type: "review", id: "weather", action: "approve" },
    "teacher",
  );
  assert.equal(pending(next).status, "approved");
  assert.equal(resourceUsed(next, "power"), 4);
});

test("aprobar exige stock para todos los proyectos aprobados", () => {
  const state = fresh();
  state.resources.find((resource) => resource.id === "power")!.total = 3;
  assert.throws(
    () =>
      applyMutation(
        state,
        { type: "review", id: "weather", action: "approve" },
        "teacher",
      ),
    /stock suficiente/,
  );
  assert.equal(pending(state).status, "pending");
});

test("los permisos dependen del perfil y del profesor asignado", () => {
  const state = fresh();
  assert.throws(
    () =>
      applyMutation(
        state,
        { type: "review", id: "weather", action: "approve" },
        "admin",
      ),
    /permiso/,
  );
  assert.throws(
    () =>
      applyMutation(
        state,
        { type: "review", id: "weather", action: "approve" },
        "student",
      ),
    /permiso/,
  );
  pending(state).teachers = ["Paula Torres"];
  assert.throws(
    () =>
      applyMutation(
        state,
        { type: "review", id: "weather", action: "approve" },
        "teacher",
      ),
    /profesor responsable/,
  );
  assert.throws(
    () =>
      applyMutation(
        state,
        { type: "saveSpace", space: state.spaces[0] },
        "guest",
      ),
    /permiso/,
  );
  assert.throws(
    () =>
      applyMutation(state, { type: "deleteProject", id: "plant" }, "student"),
    /tus proyectos/,
  );
  assert.throws(
    () =>
      applyMutation(
        state,
        { type: "saveProject", project: state.projects[0] },
        "student",
      ),
    /tus proyectos/,
  );
});

test("solicitar cambios exige un motivo y reenviar vuelve a pendiente", () => {
  const state = fresh();
  assert.throws(
    () =>
      applyMutation(
        state,
        { type: "review", id: "weather", action: "changes", feedback: "Corto" },
        "teacher",
      ),
    /10 y 800/,
  );
  const changed = applyMutation(
    state,
    {
      type: "review",
      id: "weather",
      action: "changes",
      feedback: "Agregá detalle de los materiales.",
    },
    "teacher",
  );
  assert.equal(pending(changed).status, "changes");
  assert.throws(
    () =>
      applyMutation(
        changed,
        { type: "review", id: "weather", action: "approve" },
        "teacher",
      ),
    /pendientes/,
  );
  const next = applyMutation(
    changed,
    { type: "saveProject", project: pending(changed) },
    "student",
  );
  assert.equal(pending(next).status, "pending");
  assert.equal(pending(next).feedback, "");
});

test("un retiro por jornada no se repite después de devolver", () => {
  const state = fresh();
  assert.throws(
    () =>
      applyMutation(
        state,
        {
          type: "lend",
          projectId: "plant",
          resourceId: "chair",
          day: 1,
          quantity: 1,
        },
        "loans",
      ),
    /otro retiro/,
  );
  const next = applyMutation(
    state,
    {
      type: "lend",
      projectId: "plant",
      resourceId: "chair",
      day: 2,
      quantity: 2,
    },
    "loans",
  );
  assert.equal(resourceOut(next, "chair", 2), 2);
  assert.throws(
    () =>
      applyMutation(
        next,
        {
          type: "lend",
          projectId: "plant",
          resourceId: "chair",
          day: 2,
          quantity: 1,
        },
        "loans",
      ),
    /lo asignado/,
  );
});

test("las devoluciones parciales conservan el saldo y no pueden excederlo", () => {
  const next = applyMutation(
    fresh(),
    {
      type: "lend",
      projectId: "robot",
      resourceId: "chair",
      day: 1,
      quantity: 3,
    },
    "loans",
  );
  const loan = next.loans.at(-1)!;
  const returned = applyMutation(
    next,
    {
      type: "returnLoan",
      id: loan.id,
      quantity: 1,
      notes: "Falta una revisión",
    },
    "loans",
  );
  assert.equal(resourceOut(returned, "chair", 1), 2);
  assert.equal(returned.loans.at(-1)!.notes, "Falta una revisión");
  assert.throws(
    () =>
      applyMutation(
        returned,
        { type: "returnLoan", id: loan.id, quantity: 3, notes: "" },
        "loans",
      ),
    /cantidad pendiente/,
  );
  assert.throws(
    () =>
      applyMutation(
        returned,
        { type: "returnLoan", id: loan.id, quantity: 0, notes: "" },
        "loans",
      ),
    /entero positivo/,
  );
});

test("los elementos no devueltos de otra jornada siguen ocupando stock", () => {
  const state = fresh();
  state.resources.find((resource) => resource.id === "power")!.total = 2;
  const day1 = applyMutation(
    state,
    {
      type: "lend",
      projectId: "plant",
      resourceId: "power",
      day: 1,
      quantity: 1,
    },
    "loans",
  );
  assert.throws(
    () =>
      applyMutation(
        day1,
        {
          type: "lend",
          projectId: "robot",
          resourceId: "power",
          day: 2,
          quantity: 1,
        },
        "loans",
      ),
    /devolverse/,
  );
  const returned = applyMutation(
    day1,
    { type: "returnLoan", id: "loan1", quantity: 1, notes: "" },
    "loans",
  );
  assert.equal(
    resourceOut(
      applyMutation(
        returned,
        {
          type: "lend",
          projectId: "robot",
          resourceId: "power",
          day: 2,
          quantity: 1,
        },
        "loans",
      ),
      "power",
      2,
    ),
    1,
  );
});

test("no se reduce el stock por debajo de reservas ni de entregas abiertas", () => {
  const state = fresh();
  const resource = state.resources.find((item) => item.id === "chair")!;
  assert.throws(
    () =>
      applyMutation(
        state,
        { type: "saveResource", resource: { ...resource, total: 6 } },
        "admin",
      ),
    /reservada/,
  );
  state.projects.find((project) => project.id === "robot")!.status = "changes";
  state.projects.find((project) => project.id === "plant")!.status = "changes";
  const power = state.resources.find((item) => item.id === "power")!;
  assert.throws(
    () =>
      applyMutation(
        state,
        { type: "saveResource", resource: { ...power, total: 0 } },
        "admin",
      ),
    /pendiente de devolución/,
  );
});

test("no se borran espacios, mesas, elementos ni proyectos con referencias", () => {
  const state = fresh();
  assert.throws(
    () => applyMutation(state, { type: "deleteSpace", id: "patio" }, "admin"),
    /proyectos asignados/,
  );
  assert.throws(
    () =>
      applyMutation(state, { type: "deleteResource", id: "power" }, "admin"),
    /historial/,
  );
  assert.throws(
    () => applyMutation(state, { type: "deleteProject", id: "robot" }, "admin"),
    /historial/,
  );
  assert.throws(
    () => applyMutation(state, { type: "deleteProject", id: "plant" }, "admin"),
    /historial/,
  );
  const space = {
    ...state.spaces[0],
    furniture: state.spaces[0].furniture.filter((item) => item.id !== "P03"),
  };
  assert.throws(
    () => applyMutation(state, { type: "saveSpace", space }, "admin"),
    /mesa que tiene/,
  );
  const changedType = structuredClone(state.spaces[0]);
  changedType.furniture.find((item) => item.id === "P03")!.type = "bench";
  assert.throws(
    () =>
      applyMutation(state, { type: "saveSpace", space: changedType }, "admin"),
    /mesa que tiene/,
  );
});

test("reabrir conserva préstamos y limita cambios de recursos y ubicación", () => {
  assert.throws(
    () =>
      applyMutation(
        fresh(),
        { type: "review", id: "robot", action: "reopen" },
        "admin",
      ),
    /devolverse/,
  );
  const returned = applyMutation(
    fresh(),
    { type: "returnLoan", id: "loan1", quantity: 1, notes: "" },
    "loans",
  );
  const state = applyMutation(
    returned,
    { type: "review", id: "robot", action: "reopen" },
    "admin",
  );
  const project = state.projects.find((item) => item.id === "robot")!;
  assert.equal(state.loans.find((loan) => loan.id === "loan1")!.returned, 1);
  assert.throws(
    () =>
      applyMutation(
        state,
        {
          type: "saveProject",
          project: { ...project, resources: { chair: 3 } },
        },
        "student",
      ),
    /reducir un elemento/,
  );
  state.loans.find((loan) => loan.id === "loan1")!.returned = 0;
  assert.throws(
    () =>
      applyMutation(
        state,
        { type: "saveProject", project: { ...project, furnitureId: "P02" } },
        "student",
      ),
    /antes de cambiar/,
  );
});

test("nuevos proyectos requieren imagen y datos válidos; actualizaciones preservan la fecha", () => {
  const state = fresh();
  const project: Project = {
    ...pending(state),
    id: "nuevo",
    furnitureId: "P02",
    image,
  };
  assert.throws(
    () =>
      applyMutation(
        state,
        { type: "saveProject", project: { ...project, image: "" } },
        "student",
      ),
    /imagen referencial/,
  );
  assert.throws(
    () =>
      applyMutation(
        state,
        {
          type: "saveProject",
          project: { ...project, video: "javascript:alert(1)" },
        },
        "student",
      ),
    /MP4 o WebM/,
  );
  assert.throws(
    () =>
      applyMutation(
        state,
        {
          type: "saveProject",
          project: { ...project, resources: { chair: -1 } },
        },
        "student",
      ),
    /entero positivo/,
  );
  const next = applyMutation(
    state,
    { type: "saveProject", project },
    "student",
  );
  assert.equal(next.projects.at(-1)!.status, "pending");
  const edited = applyMutation(
    next,
    { type: "saveProject", project: { ...project, createdAt: "2000-01-01" } },
    "student",
  );
  assert.equal(edited.projects.at(-1)!.createdAt, project.createdAt);
});

test("validaciones del plano y stock rechazan valores inválidos", () => {
  const state = fresh();
  const space = structuredClone(state.spaces[1]);
  space.furniture[0].x = NaN;
  assert.throws(
    () => applyMutation(state, { type: "saveSpace", space }, "admin"),
    /coordenadas/,
  );
  assert.throws(
    () =>
      applyMutation(
        state,
        {
          type: "saveResource",
          resource: { ...state.resources[0], total: 1.5 },
        },
        "admin",
      ),
    /entero/,
  );
  assert.throws(
    () =>
      applyMutation(
        state,
        {
          type: "lend",
          projectId: "robot",
          resourceId: "chair",
          day: 4,
          quantity: 1,
        },
        "loans",
      ),
    /jornada/,
  );
});

test("guardar un plano permite achicar mesas ocupadas y agregar etiquetas sin perder referencias", () => {
  const state = fresh();
  const original = structuredClone(state);
  const space = structuredClone(state.spaces[0]);
  const table = space.furniture.find((item) => item.id === "P01")!;
  table.width = 8;
  table.height = 5;
  space.furniture.push({
    id: "zona-entrada",
    type: "label",
    text: "  Entrada principal  ",
    x: 20,
    y: 12,
    rotation: 0,
  });
  space.createdAt = "2000-01-01";

  const next = applyMutation(state, { type: "saveSpace", space }, "admin");
  const saved = next.spaces.find((item) => item.id === space.id)!;
  assert.equal(saved.furniture.find((item) => item.id === "P01")!.width, 8);
  assert.equal(saved.furniture.find((item) => item.id === "P01")!.height, 5);
  assert.equal(saved.furniture.at(-1)!.text, "Entrada principal");
  assert.equal(saved.createdAt, state.spaces[0].createdAt);
  assert.deepEqual(next.projects, state.projects);
  assert.deepEqual(next.loans, state.loans);
  assert.deepEqual(state, original);
  assert.equal(space.furniture.at(-1)!.text, "  Entrada principal  ");

  const changedType = structuredClone(saved);
  const assigned = changedType.furniture.find((item) => item.id === "P01")!;
  assigned.type = "label";
  assigned.text = "Zona de robótica";
  assert.throws(
    () =>
      applyMutation(next, { type: "saveSpace", space: changedType }, "admin"),
    /mesa que tiene un proyecto asignado/,
  );
});

test("guardar un plano anterior acepta mesas sin dimensiones y conserva sus datos", () => {
  const state = fresh();
  const next = applyMutation(
    state,
    { type: "saveSpace", space: state.spaces[0] },
    "admin",
  );
  assert.deepEqual(next, state);
  const table = next.spaces[0].furniture.find((item) => item.type === "table")!;
  assert.equal(table.width, undefined);
  assert.equal(table.height, undefined);
});

test("guardar mesas rechaza dimensiones no finitas o fuera del intervalo admitido", () => {
  const state = fresh();
  const invalid: { dimension: "width" | "height"; values: number[] }[] = [
    { dimension: "width", values: [NaN, Infinity, -Infinity, -1, 5.9, 30.1] },
    { dimension: "height", values: [NaN, Infinity, -Infinity, -1, 3.9, 25.1] },
  ];
  for (const { dimension, values } of invalid) {
    for (const value of values) {
      const space = structuredClone(state.spaces[0]);
      space.furniture.find((item) => item.type === "table")![dimension] = value;
      assert.throws(
        () => applyMutation(state, { type: "saveSpace", space }, "admin"),
        /de la mesa debe estar entre/,
      );
    }
  }
  const space = structuredClone(state.spaces[0]);
  const table = space.furniture.find((item) => item.type === "table")!;
  table.width = 6;
  table.height = 25;
  assert.doesNotThrow(() =>
    applyMutation(state, { type: "saveSpace", space }, "admin"),
  );
});

test("las etiquetas requieren texto con entre 2 y 60 caracteres después de quitar espacios", () => {
  const state = fresh();
  for (const text of [undefined, "", "   ", " A ", "A".repeat(61)]) {
    const space = structuredClone(state.spaces[0]);
    const label: Furniture = {
      id: "label",
      type: "label",
      text,
      x: 50,
      y: 50,
      rotation: 0,
    };
    space.furniture.push(label);
    assert.throws(
      () => applyMutation(state, { type: "saveSpace", space }, "admin"),
      /texto de la etiqueta debe tener entre 2 y 60/,
    );
  }
});

test("las mutaciones son inmutables y no conservan referencias del formulario", () => {
  const state = fresh();
  const snapshot = structuredClone(state);
  const project = { ...pending(state), name: "Nueva estación meteorológica" };
  const next = applyMutation(
    state,
    { type: "saveProject", project },
    "student",
  );
  assert.deepEqual(state, snapshot);
  assert.notEqual(next, state);
  assert.notEqual(pending(next), pending(state));
  project.name = "Cambio externo";
  assert.equal(pending(next).name, "Nueva estación meteorológica");
  next.projects[0].resources.chair = 99;
  assert.equal(state.projects[0].resources.chair, 3);
});

test("crear un proyecto permite un equipo de varios integrantes y conserva al creador", () => {
  const state = fresh();
  const project: Project = {
    ...pending(state),
    id: "equipo-nuevo",
    furnitureId: "P02",
    image,
    members: ["  Lucía   Fernández  ", "Ana O'Connor", "María José Pérez"],
  };
  const snapshot = structuredClone(project);
  const next = applyMutation(
    state,
    { type: "saveProject", project },
    "student",
  );
  assert.deepEqual(next.projects.at(-1)!.members, [
    "Lucía Fernández",
    "Ana O'Connor",
    "María José Pérez",
  ]);
  assert.equal(next.projects.at(-1)!.student, "Lucía Fernández");
  assert.deepEqual(project, snapshot);
  assert.equal(state.projects.length, seed.projects.length);
  assert.throws(
    () =>
      applyMutation(
        state,
        {
          type: "saveProject",
          project: { ...project, student: "Ana O'Connor" },
        },
        "student",
      ),
    /como creadora/,
  );
});

test("editar requiere pertenecer previamente al equipo, incluso si se intenta agregar al enviar", () => {
  const state = fresh();
  const project = state.projects.find((item) => item.id === "plant")!;
  project.status = "changes";
  const joined = {
    ...project,
    members: [...project.members, "Lucía Fernández"],
  };
  assert.throws(
    () =>
      applyMutation(state, { type: "saveProject", project: joined }, "student"),
    /tus proyectos/,
  );
  project.members.push("Lucía Fernández");
  const next = applyMutation(
    state,
    { type: "saveProject", project: { ...project, name: "Huerta en equipo" } },
    "student",
  );
  const saved = next.projects.find((item) => item.id === "plant")!;
  assert.equal(saved.student, "Nicolás Romero");
  assert.equal(saved.name, "Huerta en equipo");
  assert.equal(saved.status, "pending");
  assert.throws(
    () =>
      applyMutation(
        state,
        {
          type: "saveProject",
          project: { ...project, student: "Lucía Fernández" },
        },
        "student",
      ),
    /cambiar el alumno que creó/,
  );
});

test("eliminar una propuesta pendiente permite integrantes existentes y mantiene las restricciones", () => {
  const state = fresh();
  const project = pending(state);
  project.student = "Tomás Pérez";
  project.members = ["Tomás Pérez", "  LUCÍA   FERNÁNDEZ  "];
  const next = applyMutation(
    state,
    { type: "deleteProject", id: project.id },
    "student",
  );
  assert.equal(
    next.projects.some((item) => item.id === project.id),
    false,
  );
  project.members = ["Tomás Pérez"];
  assert.throws(
    () =>
      applyMutation(
        state,
        { type: "deleteProject", id: project.id },
        "student",
      ),
    /tus proyectos/,
  );
  assert.doesNotThrow(() =>
    applyMutation(state, { type: "deleteProject", id: project.id }, "admin"),
  );
  project.members.push("Lucía Fernández");
  project.status = "approved";
  assert.throws(
    () =>
      applyMutation(
        state,
        { type: "deleteProject", id: project.id },
        "student",
      ),
    /no están aprobados/,
  );
});

test("el equipo rechaza nombres inválidos, vacío y duplicados con diferentes espacios o mayúsculas", () => {
  const state = fresh();
  const project = pending(state);
  for (const members of [
    [],
    ["Lucía Fernández", "Ana Pérez2"],
    ["Lucía Fernández", "Ana"],
    ["Lucía Fernández", "Ana Pérez", " ana   PÉREZ "],
  ]) {
    assert.throws(() =>
      applyMutation(
        state,
        { type: "saveProject", project: { ...project, members } },
        "student",
      ),
    );
  }
  const errors = teamErrors(["Ana Pérez", "  ana   PÉREZ ", "Tomás 123"]);
  assert.match(errors[0], /dos veces/);
  assert.match(errors[1], /dos veces/);
  assert.match(errors[2], /solo letras/);
  assert.equal(memberNameError("Ana O'Connor"), "");
  assert.equal(memberNameError("Ana O’Connor"), "");
  assert.match(memberNameError("Ana O''Connor"), /entre letras/);
  assert.match(memberNameError("Ana Pérez-Soto"), /solo letras/);
  assert.match(memberNameError(`Ana ${"P".repeat(100)}`), /3 y 100/);
  assert.equal(
    memberKey("  LUCÍA   FERNÁNDEZ  "),
    memberKey("Lucía Fernández"),
  );
});

test("el creador y el integrante que guarda deben permanecer en el equipo", () => {
  const state = fresh();
  const project = pending(state);
  assert.throws(
    () =>
      applyMutation(
        state,
        {
          type: "saveProject",
          project: { ...project, members: ["Tomás Pérez"] },
        },
        "student",
      ),
    /creó la propuesta debe permanecer/,
  );
  project.student = "Tomás Pérez";
  assert.throws(
    () =>
      applyMutation(
        state,
        {
          type: "saveProject",
          project: { ...project, members: ["Tomás Pérez"] },
        },
        "student",
      ),
    /Lucía Fernández debe permanecer/,
  );
});

test("la migración de proyectos anteriores conserva espacios, tamaños, etiquetas, recursos y préstamos", () => {
  const legacy = fresh();
  Reflect.deleteProperty(legacy.projects[0], "members");
  legacy.spaces[0].furniture[0].width = 8;
  legacy.spaces[0].furniture[0].height = 5;
  legacy.spaces[0].furniture.push({
    id: "zona",
    type: "label",
    text: "Entrada",
    x: 10,
    y: 10,
    rotation: 0,
  });
  const snapshot = structuredClone(legacy);
  const migrated = migrateProjectTeams(legacy);
  assert.deepEqual(migrated.projects[0].members, [legacy.projects[0].student]);
  assert.deepEqual(migrated.projects[1].members, legacy.projects[1].members);
  assert.notEqual(migrated.projects[1].members, legacy.projects[1].members);
  assert.equal(migrated.spaces, legacy.spaces);
  assert.equal(migrated.resources, legacy.resources);
  assert.equal(migrated.loans, legacy.loans);
  assert.deepEqual(legacy, snapshot);
  assert.deepEqual(projectMembers({ student: "Ana Pérez" }), ["Ana Pérez"]);
  assert.equal(
    isProjectMember({ student: "Ana Pérez" }, " ANA   PÉREZ "),
    true,
  );
});
