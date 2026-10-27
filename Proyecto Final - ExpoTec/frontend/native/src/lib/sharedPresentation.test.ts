/** Pruebas unitarias de `sharedPresentation.ts` (se ejecutan con `npm test` usando node:test y tsx). */
import test from "node:test";
import assert from "node:assert/strict";
import { loadPresentation, presentationSelection } from "./sharedPresentation";
import type {
  PresentationPage,
  PresentationProject,
} from "./sharedPresentation";
const project = (id: string) => ({ id }) as PresentationProject;

test("la presentación carga todas las páginas antes de reemplazar la secuencia y evita ciclos", async () => {
  const bodies: object[] = [];
  const pages: PresentationPage[] = [
    { projects: [project("a")], nextCursor: "a" },
    { projects: [project("b")], nextCursor: null },
  ];
  const result = await loadPresentation(
    async <T>(_path: string, body: object) => {
      bodies.push(body);
      return pages.shift() as T;
    },
  );
  assert.deepEqual(
    result?.map((item) => item.id),
    ["a", "b"],
  );
  assert.deepEqual(bodies, [{ limit: 100 }, { limit: 100, after: "a" }]);
  await assert.rejects(
    loadPresentation(
      async <T>() => ({ projects: [project("a")], nextCursor: "a" }) as T,
    ),
    /página inválida/,
  );
  let calls = 0;
  await assert.rejects(
    loadPresentation(async <T>() => {
      if (calls++) throw new Error("Sin conexión");
      return { projects: [project("a")], nextCursor: "a" } as T;
    }),
    /Sin conexión/,
  );
});

test("una consulta abandonada no publica resultados ni sigue pidiendo páginas", async () => {
  let calls = 0;
  const result = await loadPresentation(
    async <T>() => {
      calls++;
      return { projects: [project("a")], nextCursor: "a" } as T;
    },
    () => false,
  );
  assert.equal(result, null);
  assert.equal(calls, 1);
});

test("la selección conserva la identidad al actualizar y recorre los extremos y una sola ficha", () => {
  const projects = ["a", "b", "c"].map(project);
  assert.equal(presentationSelection(projects, "b"), "b");
  assert.equal(presentationSelection([project("c"), project("b")], "b"), "b");
  assert.equal(presentationSelection(projects, "c", 1), "a");
  assert.equal(presentationSelection(projects, "a", -1), "c");
  assert.equal(presentationSelection(projects, "removed"), "a");
  assert.equal(presentationSelection([project("a")], "a", 1), "a");
  assert.equal(presentationSelection([], "a"), "");
});
