/** Tipos y nombres compartidos por los componentes de acceso social. */

/** Proveedor social configurado en el servidor. */
export type Provider = { id: string; name: string };
/** Estado de un acceso social pendiente, informado por la API. */
export type SocialStatus = {
  provider: string;
  email: string;
  /** signup: cuenta nueva · link: vincular cuenta existente · login: ingresar. */
  mode: "signup" | "link" | "login";
};
/** Datos que completa la persona al crear o vincular su cuenta. */
export type SocialInput = {
  firstName: string;
  lastName: string;
  password: string;
  confirmation: string;
};
/** Nombre visible de cada proveedor. */
export const providerNames: Record<string, string> = {
  google: "Google",
  discord: "Discord",
  github: "GitHub",
};
