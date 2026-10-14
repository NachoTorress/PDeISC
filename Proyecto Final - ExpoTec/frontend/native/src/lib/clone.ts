/** Copia los datos planos del prototipo también en Hermes, sin depender de structuredClone. */
export function cloneData<T>(value: T): T {
  if (Array.isArray(value)) return value.map(cloneData) as T;
  if (value !== null && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneData(item)]),
    ) as T;
  return value;
}
