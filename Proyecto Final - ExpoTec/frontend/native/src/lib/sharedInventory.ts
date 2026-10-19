export interface InventoryResource {
  id: string;
  name: string;
  description: string;
  total: number;
  reserved: number;
  available: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  events?: {
    id: string;
    action: string;
    previousTotal: number | null;
    total: number;
    createdAt: string;
    firstName: string;
    lastName: string;
  }[];
}
export interface ProjectResource {
  resourceId: string;
  name: string;
  quantity: number;
  reservedQuantity: number;
  total: number;
  available: number;
  archivedAt: string | null;
}
export interface ResourceRequestDraft {
  resourceId: string;
  name: string;
  quantity: string;
}
export function integerQuantity(value: string, min: number, max: number) {
  return (
    /^\d+$/.test(value) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) >= min &&
    Number(value) <= max
  );
}
export function inventoryErrors(input: {
  name: string;
  description: string;
  total: string;
}) {
  const fields: Record<string, string> = {};
  if (
    input.name.trim().length < 2 ||
    input.name.trim().length > 100 ||
    /\p{Cc}/u.test(input.name.trim())
  )
    fields.name = "Usá entre 2 y 100 caracteres.";
  if (input.description.trim().length > 250)
    fields.description = "Usá hasta 250 caracteres.";
  if (!integerQuantity(input.total, 0, 100000))
    fields.total = "Usá un entero de 0 a 100000.";
  return fields;
}
export function requestsError(requests: ResourceRequestDraft[]) {
  if (
    requests.length > 50 ||
    new Set(requests.map((item) => item.resourceId)).size !== requests.length ||
    requests.some(
      (item) => !item.resourceId || !integerQuantity(item.quantity, 1, 10000),
    )
  )
    return "Elegí hasta 50 elementos distintos con cantidades enteras de 1 a 10000.";
  return "";
}
