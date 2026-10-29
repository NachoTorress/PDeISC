/** Convierte una fecha ISO persistida en la fecha visible DD/MM/AA. */
export function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year.slice(-2)}`;
}
/** Fecha DD/MM/AA y hora local (HH:MM) de un movimiento. */
export function formatMoment(value: string) {
  return `${formatDate(value)} ${new Date(value).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
}
/** Texto visible de cada estado de proyecto. */
export const statusLabel = {
  pending: "En revisión",
  approved: "Confirmado",
  changes: "Requiere cambios",
};
/** Profesores ficticios de la demostración. */
export const teacherNames = ["Martín García", "Paula Torres"];
