/** Pruebas unitarias de `sharedLoans.ts` (se ejecutan con `npm test` usando node:test y tsx). */
import test from "node:test";
import assert from "node:assert/strict";
import { lendingErrors, receivingErrors } from "./sharedLoans";
import type { LendingProject, LoanSummary } from "./sharedLoans";
test("la entrega requiere integrante y respeta el máximo de todas las jornadas", () => {
  const project = {
    id: "project",
    members: [{ id: "student" }],
    resources: [{ resourceId: "cable", deliverable: 1 }],
  } as LendingProject;
  const draft = {
    projectId: "project",
    recipientId: "student",
    resourceId: "cable",
    quantity: "1",
    note: "",
  };
  assert.deepEqual(lendingErrors(draft, project), {});
  assert.ok(lendingErrors({ ...draft, quantity: "2" }, project).quantity);
  assert.ok(
    lendingErrors({ ...draft, recipientId: "outsider" }, project).recipientId,
  );
  assert.ok(lendingErrors({ ...draft, quantity: "1.5" }, project).quantity);
});
test("devolver parcialmente no permite exceder el saldo; las novedades no inventan devoluciones", () => {
  const loan = { quantity: 3, returned: 1 } as LoanSummary;
  assert.deepEqual(
    receivingErrors({ quantity: "1", damagedQuantity: "0", note: "" }, loan),
    {},
  );
  assert.ok(
    receivingErrors({ quantity: "3", damagedQuantity: "0", note: "" }, loan)
      .quantity,
  );
  assert.ok(
    receivingErrors(
      {
        quantity: "1",
        damagedQuantity: "2",
        note: "Ficha averiada al regresar.",
      },
      loan,
    ).damagedQuantity,
  );
  assert.ok(
    receivingErrors({ quantity: "1", damagedQuantity: "1", note: "" }, loan)
      .note,
  );
  assert.deepEqual(
    receivingErrors(
      {
        quantity: "0",
        damagedQuantity: "0",
        note: "El equipo está buscando la unidad que falta.",
      },
      loan,
      true,
    ),
    {},
  );
});
