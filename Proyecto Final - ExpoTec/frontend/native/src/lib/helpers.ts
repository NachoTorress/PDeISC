/** Utilidades generales: identificadores y fecha de hoy. */
import * as Crypto from "expo-crypto";
/** Genera un UUID aleatorio. */
export const newId = () => Crypto.randomUUID();
/** Fecha actual en formato ISO (AAAA-MM-DD). */
export const today = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
