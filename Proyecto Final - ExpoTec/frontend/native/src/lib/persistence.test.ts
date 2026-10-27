/** Pruebas unitarias de `persistence.ts` (se ejecutan con `npm test` usando node:test y tsx). */
import assert from "node:assert/strict";
import test from "node:test";
import { cloneData } from "./clone";
import { parseSavedState } from "./persistence";
import { seed } from "./seed";
import type { Furniture, Project } from "./types";

test("restaurar conserva equipos, referencias, historial y enlaces sin alterar el JSON", () => {
  const state = cloneData(seed);
  state.projects[0].isSoftwareProject = true;
  state.projects[0].githubUrl = "https://github.com/escuela/proyecto/tree/main";
  state.projects[0].websiteUrl = "http://localhost:5173/proyecto";
  state.spaces[0].furniture[0].width = 8;
  state.spaces[0].furniture[0].height = 5;
  state.spaces[0].furniture.push({
    id: "entrada",
    type: "label",
    text: "Entrada principal",
    x: 20,
    y: 10,
    rotation: -90,
  });
  // La hidratación no recalcula ni rechaza reservas históricas por el stock actual.
  state.resources[0].total = 0;
  const raw = JSON.stringify(state);
  const restored = parseSavedState(raw);
  assert.deepEqual(restored, state);
  assert.equal(raw, JSON.stringify(state));
  restored.projects[0].members.push("Ana Pérez");
  restored.spaces[0].furniture[0].width = 15;
  assert.equal(state.projects[0].members.includes("Ana Pérez"), false);
  assert.equal(state.spaces[0].furniture[0].width, 8);
  assert.deepEqual(parseSavedState(raw), state);
});

test("restaurar equipos anteriores migra solo integrantes faltantes y conserva equipos existentes", () => {
  const legacy = cloneData(seed);
  const existing = [...legacy.projects[1].members];
  delete (legacy.projects[0] as Partial<(typeof legacy.projects)[0]>).members;
  const raw = JSON.stringify(legacy);
  const restored = parseSavedState(raw);
  assert.deepEqual(restored.projects[0].members, [legacy.projects[0].student]);
  assert.deepEqual(restored.projects[1].members, existing);
  assert.deepEqual(restored.loans, legacy.loans);
  assert.deepEqual(restored.spaces, legacy.spaces);
  assert.deepEqual(restored.resources, legacy.resources);
  assert.equal(raw, JSON.stringify(legacy));
});

test("JSON inválido, colecciones ausentes y registros nulos fallan sin fabricar un estado", () => {
  for (const raw of ["", "{", "null", "[]", "{}"])
    assert.throws(() => parseSavedState(raw));
  for (const key of ["spaces", "projects", "resources", "loans"] as const) {
    for (const invalid of [undefined, null, {}, [null], [5], [[]]]) {
      const state: Record<string, unknown> = cloneData(
        seed,
      ) as unknown as Record<string, unknown>;
      state[key] = invalid;
      assert.throws(() => parseSavedState(JSON.stringify(state)), key);
    }
  }
});

test("restaurar rechaza campos consumidos por pantalla con tipos, números y fechas incorrectos", () => {
  const changes = [
    (state: typeof seed) => {
      state.resources[0].name = null as unknown as string;
    },
    (state: typeof seed) => {
      state.resources[0].total = -1;
    },
    (state: typeof seed) => {
      state.resources[0].total = 1.5;
    },
    (state: typeof seed) => {
      state.resources[0].createdAt = "2026-02-30";
    },
    (state: typeof seed) => {
      state.projects[0].subjects = [null as unknown as string];
    },
    (state: typeof seed) => {
      state.projects[0].teachers = [];
    },
    (state: typeof seed) => {
      state.projects[0].members = null as unknown as string[];
    },
    (state: typeof seed) => {
      state.projects[0].members = ["Lucía Fernández", "LUCÍA FERNÁNDEZ"];
    },
    (state: typeof seed) => {
      state.projects[0].resources = [] as unknown as Record<string, number>;
    },
    (state: typeof seed) => {
      state.projects[0].resources.power = -1;
    },
    (state: typeof seed) => {
      state.projects[0].image = {} as unknown as string;
    },
    (state: typeof seed) => {
      state.projects[0].status = "unknown" as Project["status"];
    },
    (state: typeof seed) => {
      state.spaces[0].furniture[0].x = Infinity;
    },
    (state: typeof seed) => {
      state.spaces[0].furniture[0].rotation = NaN;
    },
    (state: typeof seed) => {
      state.spaces[0].furniture[0].type = "chair" as Furniture["type"];
    },
    (state: typeof seed) => {
      state.spaces[0].furniture[0].width = 0;
    },
    (state: typeof seed) => {
      state.loans[0].day = 4;
    },
    (state: typeof seed) => {
      state.loans[0].returned = state.loans[0].quantity + 1;
    },
    (state: typeof seed) => {
      state.loans[0].quantity = "1" as unknown as number;
    },
    (state: typeof seed) => {
      state.loans[0].notes = null as unknown as string;
    },
    (state: typeof seed) => {
      state.resources[1].id = state.resources[0].id;
    },
  ];
  for (const change of changes) {
    const state = cloneData(seed);
    change(state);
    const raw = JSON.stringify(state);
    assert.throws(() => parseSavedState(raw));
    assert.equal(JSON.stringify(state), raw);
  }
});

test("los enlaces opcionales deben ser seguros y de tipos válidos al restaurar", () => {
  for (const changes of [
    { isSoftwareProject: "true" },
    { githubUrl: 5 },
    { githubUrl: "https://github.com.ejemplo.com/escuela/proyecto" },
    { websiteUrl: "javascript:alert(1)" },
    { websiteUrl: "https://usuario:clave@ejemplo.com/proyecto" },
  ]) {
    const state = cloneData(seed);
    Object.assign(state.projects[0], changes);
    assert.throws(() => parseSavedState(JSON.stringify(state)));
  }
  assert.deepEqual(parseSavedState(JSON.stringify(seed)), seed);
});
