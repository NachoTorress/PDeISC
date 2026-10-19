import test from "node:test";
import assert from "node:assert/strict";
import {
  integerQuantity,
  inventoryErrors,
  requestsError,
} from "./sharedInventory";
import {
  proposalDraft,
  proposalErrors,
  proposalRequest,
} from "./sharedProjects";
import type { AccountUser } from "./authTypes";

test("las cantidades exigen enteros explícitos; cero es válido solo para existencias", () => {
  assert.equal(integerQuantity("0", 0, 100000), true);
  for (const value of ["", "-1", "1.2", "1e2", "Infinity", " 2", "100001"])
    assert.equal(integerQuantity(value, 0, 100000), false);
  assert.equal(
    inventoryErrors({ name: "Cable", description: "", total: "0" }).total,
    undefined,
  );
  assert.ok(
    requestsError([{ resourceId: "cable", name: "Cable", quantity: "0" }]),
  );
  assert.ok(
    requestsError([
      { resourceId: "cable", name: "Cable", quantity: "1" },
      { resourceId: "cable", name: "Cable", quantity: "2" },
    ]),
  );
});
test("la propuesta envía solo IDs y cantidades de recursos, sin existencias ni reservas confiadas al cliente", () => {
  const user = {
    id: "student",
    firstName: "Ana",
    lastName: "García",
  } as AccountUser;
  const draft = proposalDraft(user);
  draft.resources = [{ resourceId: "cable", name: "Cable", quantity: "2" }];
  assert.deepEqual(proposalRequest(draft).resources, [
    { resourceId: "cable", quantity: 2 },
  ]);
  draft.resources[0].quantity = "0.5";
  assert.ok(proposalErrors(draft, user.id).resources);
});
