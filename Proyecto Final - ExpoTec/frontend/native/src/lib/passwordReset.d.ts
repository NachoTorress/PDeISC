/**
 * Lectura del enlace de recuperación de contraseña. Variante por plataforma: Metro elige `.native.ts` en Android y `.web.ts` en el navegador; `.d.ts` declara la interfaz común.
 */
export const passwordReset: {
  pending(): string | null;
  clear(): void;
};
