/** Pruebas unitarias de `authValidation.ts` (se ejecutan con `npm test` usando node:test y tsx). */
import test from "node:test";
import assert from "node:assert/strict";
import { validateCredentials } from "./authValidation";

test("registro valida nombres Unicode, correo y longitud sin alterar la contraseña", () => {
  const input = {
    email: " alumna@example.com ",
    password: "  contraseña larga  ",
    firstName: "Lucía",
    lastName: "O’Connor",
  };
  assert.deepEqual(validateCredentials(input, true), {});
  assert.ok(
    validateCredentials({ ...input, firstName: "Lucía2" }, true).firstName,
  );
  assert.ok(validateCredentials({ ...input, lastName: "" }, true).lastName);
  assert.ok(validateCredentials({ ...input, email: "a@" }, true).email);
  assert.ok(
    validateCredentials({ ...input, password: "corta" }, true).password,
  );
  assert.deepEqual(
    validateCredentials({ email: input.email, password: "corta" }, false),
    {},
  );
  assert.ok(validateCredentials({ ...input, password: "" }, false).password);
});

test("el registro exige al menos una letra en nombre y apellido, conservando nombres con marcas Unicode", () => {
  const input = {
    email: "alumna@example.com",
    password: "Una contraseña larga 2026",
    firstName: "A\u0301",
    lastName: "मुकेश",
  };
  assert.deepEqual(validateCredentials(input, true), {});
  for (const key of ["firstName", "lastName"] as const)
    for (const name of ["\u0301", "\u0301 \u0308", "\u0301'\u0308"])
      assert.ok(validateCredentials({ ...input, [key]: name }, true)[key]);
});
