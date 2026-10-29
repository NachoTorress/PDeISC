/** Pruebas unitarias de `adminUsers.ts` (se ejecutan con `npm test` usando node:test y tsx). */
import test from "node:test";
import assert from "node:assert/strict";
import { rolesChangeBody, sameRoles } from "./adminUsers";
import type { ManagedUser } from "./adminUsers";
import type { AccountRole } from "./authTypes";

test("los permisos se comparan como conjuntos sin modificar las selecciones", () => {
  const roles: AccountRole[] = ["teacher", "student"];
  assert.equal(sameRoles(roles, ["student", "teacher"]), true);
  assert.equal(sameRoles(roles, ["student"]), false);
  assert.equal(sameRoles([], []), true);
  assert.deepEqual(roles, ["teacher", "student"]);
});

test("guardar conserva los permisos leídos y no permite que editar el envío altere el origen", () => {
  const source: ManagedUser = {
    id: "user",
    firstName: "Ana",
    lastName: "García",
    email: "ana@example.com",
    createdAt: "2026-10-21",
    active: true,
    roles: ["student"],
  };
  const roles: AccountRole[] = ["student", "teacher"];
  const body = rolesChangeBody(source, roles);
  assert.deepEqual(body, {
    expectedRoles: ["student"],
    roles: ["student", "teacher"],
  });
  body.expectedRoles.push("admin");
  body.roles.push("loans");
  assert.deepEqual(source.roles, ["student"]);
  assert.deepEqual(roles, ["student", "teacher"]);
});
