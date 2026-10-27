/** Pruebas unitarias de `projectSubjects.ts` (se ejecutan con `npm test` usando node:test y tsx). */
import assert from "node:assert/strict";
import test from "node:test";
import { seed } from "./seed";
import {
  projectSubjectInputError,
  projectSubjectKey,
  projectSubjectSuggestions,
  suggestedProjectSubjects,
} from "./projectSubjects";

test("materias: reconoce duplicados con mayúsculas, acentos y espacios exteriores", () => {
  assert.equal(projectSubjectKey("  PROGRAMACIÓN "), "programacion");
  assert.equal(
    projectSubjectInputError(" programacion ", ["Programación"]),
    "Esa materia ya está agregada.",
  );
  assert.equal(
    projectSubjectInputError("Sistemas de control", ["Programación"]),
    "",
  );
});

test("materias: conserva los límites y formatos admitidos por la propuesta", () => {
  for (const input of [
    "",
    " ",
    "a",
    "a".repeat(81),
    "Física\nTaller",
    "Taller\tindustrial",
  ])
    assert.ok(projectSubjectInputError(input, []), input);
  assert.equal(projectSubjectInputError("a".repeat(80), []), "");
  assert.match(
    projectSubjectInputError(
      "Nueva materia",
      Array.from({ length: 10 }, (_, index) => `Materia ${index}`),
    ),
    /10 materias/,
  );
});

test("materias: las sugerencias provienen de ejemplos existentes y no repiten las elegidas", () => {
  const existing = new Set(
    seed.projects.flatMap((project) => project.subjects),
  );
  assert.ok(projectSubjectSuggestions.length > 0);
  assert.ok(
    projectSubjectSuggestions.every((subject) => existing.has(subject)),
  );
  assert.deepEqual(
    suggestedProjectSubjects(["Programación"], "programacion"),
    [],
  );
  assert.deepEqual(suggestedProjectSubjects([], "fisica"), ["Física"]);
  assert.deepEqual(suggestedProjectSubjects([], "Materia personalizada"), []);
  assert.equal(projectSubjectInputError("Materia personalizada", []), "");
});
