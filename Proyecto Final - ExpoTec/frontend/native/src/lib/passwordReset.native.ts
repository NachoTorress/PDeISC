/** En Android el enlace de recuperación se abre en la web: no hay token que leer. */
export const passwordReset = {
  pending: (): string | null => null,
  clear: () => {},
};
