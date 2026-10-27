/** Tipos y validaciones del inventario compartido. */
/** Elemento tal como lo devuelve `GET /api/inventory`. */
export interface InventoryResource {
  id: string;
  name: string;
  description: string;
  total: number;
  reserved: number;
  available: number;
  unavailable: number;
  outstanding: number;
  availableToLend: number;
  shortage: number;
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
    previousUnavailable: number | null;
    unavailable: number;
    note: string;
  }[];
}
/** Elemento pedido por un proyecto. */
export interface ProjectResource {
  resourceId: string;
  name: string;
  quantity: number;
  reservedQuantity: number;
  total: number;
  available: number;
  archivedAt: string | null;
  unavailable: number;
  outstanding: number;
}
/** Pedido de un elemento en el formulario. */
export interface ResourceRequestDraft {
  resourceId: string;
  name: string;
  quantity: string;
}
/** Convierte texto a entero dentro de un rango, o null. */
export function integerQuantity(value: string, min: number, max: number) {
  return (
    /^\d+$/.test(value) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) >= min &&
    Number(value) <= max
  );
}
/** Errores por campo del formulario de elemento. */
export function inventoryErrors(input: {
  name: string;
  description: string;
  total: string;
  unavailable?: string;
  note?: string;
  previousUnavailable?: number;
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
  if (
    input.unavailable !== undefined &&
    (!integerQuantity(input.unavailable, 0, 100000) ||
      Number(input.unavailable) > Number(input.total))
  )
    fields.unavailable = "Indicá un entero entre 0 y el total.";
  if (
    (input.note?.trim().length ?? 0) > 1000 ||
    (input.unavailable !== undefined &&
      Number(input.unavailable) !== (input.previousUnavailable ?? 0) &&
      (input.note?.trim().length ?? 0) < 10)
  )
    fields.note = "Explicá el cambio de estado con 10 a 1000 caracteres.";
  return fields;
}
/** Valida el pedido de elementos de una propuesta. */
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
