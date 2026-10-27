/** Pruebas unitarias de `sharedProjects.ts` (se ejecutan con `npm test` usando node:test y tsx). */
import test from "node:test";
import assert from "node:assert/strict";
import {
  proposalDraft,
  proposalErrors,
  proposalRequest,
  sharedLinkError,
} from "./sharedProjects";
import type { AccountUser } from "./authTypes";
const user: AccountUser = {
  id: "student",
  firstName: "Lucía",
  lastName: "García",
  email: "student@example.com",
  roles: ["student"],
  createdAt: "2026-10-19",
};
test("la propuesta vincula cuentas y conserva al creador y al editor", () => {
  const draft = proposalDraft(user);
  assert.deepEqual(proposalRequest(draft).memberIds, [user.id]);
  draft.name = "Robot 2026";
  draft.description = "Automatización para la exposición técnica.";
  draft.course = "6° 1°";
  draft.imageUrl = "https://example.com/image.png";
  draft.teachers = [{ id: "teacher", firstName: "Martín", lastName: "García" }];
  draft.subjects = ["Programación"];
  draft.boothId = "booth";
  assert.deepEqual(proposalErrors(draft, user.id), {});
  draft.members = [];
  assert.ok(proposalErrors(draft, user.id).memberIds);
  assert.equal("creatorId" in proposalRequest(draft), false);
});
test("valida medios, materias duplicadas y enlaces de proyectos informáticos", () => {
  assert.equal(
    sharedLinkError("https://example.com/video.mp4?key=value", false, "video"),
    "",
  );
  assert.ok(sharedLinkError("javascript:alert(1)", true));
  assert.ok(
    sharedLinkError("https://github.com.evil.example/a/b", false, "github"),
  );
  const draft = proposalDraft(user);
  draft.subjects = ["Matemática", "matematica"];
  assert.ok(proposalErrors(draft, user.id).subjects);
  draft.websiteUrl = "https://example.com";
  assert.ok(proposalErrors(draft, user.id).isSoftwareProject);
});
