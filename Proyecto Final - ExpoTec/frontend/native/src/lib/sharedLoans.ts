import { integerQuantity } from "./sharedInventory";
export interface LoanSummary {
  id: string;
  projectId: string;
  resourceId: string;
  projectName: string;
  resourceName: string;
  day: number;
  quantity: number;
  returned: number;
  version: number;
  recipientId: string;
  note: string;
  createdAt: string;
  recipientFirstName: string;
  recipientLastName: string;
  deliveredFirstName: string;
  deliveredLastName: string;
}
export interface SharedLoan extends LoanSummary {
  returns: {
    id: string;
    quantity: number;
    damagedQuantity: number;
    note: string;
    createdAt: string;
    firstName: string;
    lastName: string;
  }[];
}
export interface LendingResource {
  resourceId: string;
  name: string;
  reservedQuantity: number;
  total: number;
  unavailable: number;
  outstanding: number;
  availableToLend: number;
  deliverable: number;
  loanId: string | null;
  archivedAt: string | null;
}
export interface LendingProject {
  id: string;
  name: string;
  course: string;
  version: number;
  spaceName: string;
  furnitureId: string;
  members: { id: string; firstName: string; lastName: string }[];
  resources: LendingResource[];
}
export interface LendingDraft {
  projectId: string;
  resourceId: string;
  recipientId: string;
  quantity: string;
  note: string;
}
export function lendingErrors(input: LendingDraft, project?: LendingProject) {
  const fields: Record<string, string> = {};
  const resource = project?.resources.find(
    (item) => item.resourceId === input.resourceId,
  );
  if (!project || project.id !== input.projectId)
    fields.projectId = "Elegí un proyecto confirmado.";
  if (!resource) fields.resourceId = "Elegí un elemento reservado.";
  if (!project?.members.some((member) => member.id === input.recipientId))
    fields.recipientId = "Elegí al integrante que retira.";
  if (!integerQuantity(input.quantity, 1, 10000))
    fields.quantity = "Usá un entero de 1 a 10000.";
  else if (resource && Number(input.quantity) > resource.deliverable)
    fields.quantity = `Podés entregar hasta ${resource.deliverable} unidades con la disponibilidad actual.`;
  if (input.note.trim().length > 1000)
    fields.note = "Usá hasta 1000 caracteres.";
  return fields;
}
export function receivingErrors(
  input: { quantity: string; damagedQuantity: string; note: string },
  loan: LoanSummary,
  noteOnly = false,
) {
  const fields: Record<string, string> = {};
  if (
    !noteOnly &&
    (!integerQuantity(input.quantity, 1, 10000) ||
      Number(input.quantity) > loan.quantity - loan.returned)
  )
    fields.quantity = `Indicá entre 1 y ${loan.quantity - loan.returned} unidades sin devolver.`;
  if (
    !noteOnly &&
    (!integerQuantity(input.damagedQuantity, 0, 10000) ||
      Number(input.damagedQuantity) > Number(input.quantity))
  )
    fields.damagedQuantity = "Las dañadas deben estar entre 0 y las recibidas.";
  if (
    input.note.trim().length > 1000 ||
    ((noteOnly || Number(input.damagedQuantity) > 0) &&
      input.note.trim().length < 10)
  )
    fields.note =
      "Para una novedad o daños, explicá el motivo con 10 a 1000 caracteres.";
  return fields;
}
