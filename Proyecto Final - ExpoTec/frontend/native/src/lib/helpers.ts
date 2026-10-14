import * as Crypto from "expo-crypto";
export const newId = () => Crypto.randomUUID();
export const today = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
