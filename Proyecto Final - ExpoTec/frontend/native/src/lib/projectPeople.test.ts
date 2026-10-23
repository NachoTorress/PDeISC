import assert from "node:assert/strict";
import test from "node:test";
import {
  projectPeopleEmail,
  projectPeopleEmailError,
  projectPeopleLimit,
  projectPersonAdditionError,
} from "./projectPeople";

test("la búsqueda de participantes valida el correo completo antes de consultar", () => {
  assert.equal(
    projectPeopleEmail(" Alumno.Apellido@Escuela.edu.ar "),
    "alumno.apellido@escuela.edu.ar",
  );
  for (const email of [
    "",
    "Lucía Fernández",
    "alumno@",
    "alumno@escuela",
    "a b@escuela.edu.ar",
    `${"a".repeat(250)}@escuela.edu.ar`,
  ])
    assert.ok(projectPeopleEmailError(email), email);
  assert.equal(projectPeopleEmailError(" Alumno+expo@Escuela.edu.ar "), "");
});

test("agregar una cuenta distingue duplicados, roles incompatibles y límites", () => {
  const input = {
    role: "student" as const,
    personId: "new",
    selectedIds: ["creator"],
    excludedIds: ["teacher"],
  };
  assert.equal(projectPersonAdditionError(input), "");
  assert.match(
    projectPersonAdditionError({ ...input, personId: "creator" }),
    /ya forma parte/,
  );
  assert.match(
    projectPersonAdditionError({ ...input, personId: "teacher" }),
    /profesor responsable/,
  );
  assert.match(
    projectPersonAdditionError({
      ...input,
      selectedIds: Array.from({ length: projectPeopleLimit.student }, (_, i) =>
        String(i),
      ),
    }),
    /12 alumnos/,
  );
  assert.match(
    projectPersonAdditionError({
      ...input,
      role: "teacher",
      selectedIds: Array.from({ length: projectPeopleLimit.teacher }, (_, i) =>
        String(i),
      ),
    }),
    /5 profesores/,
  );
  assert.match(
    projectPersonAdditionError({
      ...input,
      role: "teacher",
      personId: "teacher",
    }),
    /equipo de alumnos/,
  );
});

test("revalidar el resultado no modifica la selección ni permite duplicados al confirmar", () => {
  const selectedIds = ["creator"];
  const excludedIds = ["other-role"];
  const selection = {
    role: "student" as const,
    personId: "candidate",
    selectedIds,
    excludedIds,
  };
  assert.equal(projectPersonAdditionError(selection), "");
  selectedIds.push("candidate");
  assert.match(projectPersonAdditionError(selection), /ya forma parte/);
  assert.deepEqual(selectedIds, ["creator", "candidate"]);
  assert.deepEqual(excludedIds, ["other-role"]);
});
