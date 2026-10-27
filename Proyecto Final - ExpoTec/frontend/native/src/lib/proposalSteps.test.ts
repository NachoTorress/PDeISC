/** Pruebas unitarias de `proposalSteps.ts` (se ejecutan con `npm test` usando node:test y tsx). */
import test from "node:test";
import assert from "node:assert/strict";
import { proposalDraft, proposalErrors } from "./sharedProjects";
import {
  firstProposalIssueStep,
  proposalFlowErrors,
  proposalIssuesForStep,
} from "./proposalSteps";

const pending = { students: false, teachers: false, subjects: false };
const actor = {
  id: "actor",
  firstName: "Ana",
  lastName: "Pérez",
  email: "ana@example.invalid",
  roles: ["student" as const],
  createdAt: "2026-10-23",
};

test("el recorrido guía hacia el primer paso incompleto sin descartar los otros datos", () => {
  const draft = proposalDraft(actor);
  const errors = () =>
    proposalFlowErrors(proposalErrors(draft, actor.id), pending);
  assert.equal(firstProposalIssueStep(errors()), 0);
  Object.assign(draft, {
    name: "Huerta",
    description: "Una huerta con riego automático para la exposición.",
    course: "6° Informática",
    imageUrl: "https://example.invalid/foto.jpg",
  });
  assert.equal(firstProposalIssueStep(errors()), 1);
  draft.teachers = [{ id: "teacher", firstName: "María", lastName: "López" }];
  draft.subjects = ["Programación"];
  assert.equal(firstProposalIssueStep(errors()), 2);
  draft.boothId = "booth";
  assert.equal(firstProposalIssueStep(errors()), null);
  assert.equal(draft.members[0].id, actor.id);
  assert.equal(draft.name, "Huerta");
});

test("un correo o materia sin agregar impide omitirlo al pasar a la revisión", () => {
  for (const key of ["students", "teachers", "subjects"] as const) {
    const errors = proposalFlowErrors({}, { ...pending, [key]: true });
    assert.equal(firstProposalIssueStep(errors), 1);
    assert.equal(proposalIssuesForStep(errors, 1).length, 1);
  }
  assert.equal(firstProposalIssueStep(proposalFlowErrors({}, pending)), null);
});

test("los errores del servidor vuelven al paso del dato afectado", () => {
  assert.equal(firstProposalIssueStep({ imageUrl: "Foto inválida" }), 0);
  assert.equal(
    firstProposalIssueStep({ teacherIds: "Profesor sin permiso" }),
    1,
  );
  assert.equal(
    firstProposalIssueStep({
      resources: "Elemento dado de baja",
      boothId: "Ocupado",
    }),
    2,
  );
  assert.equal(
    firstProposalIssueStep(
      { name: "Nombre inválido", subjects: "Duplicada" },
      1,
    ),
    0,
  );
});
