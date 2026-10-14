/** Convierte una fecha ISO persistida en la fecha visible DD/MM/AA. */
export function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year.slice(-2)}`;
}
export const statusLabel = {
  pending: "En revisión",
  approved: "Confirmado",
  changes: "Requiere cambios",
};
export const teacherNames = ["Martín García", "Paula Torres"];
