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
