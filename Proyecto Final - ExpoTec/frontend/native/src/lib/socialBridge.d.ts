/**
 * Puente del acceso social entre la app y el navegador. Variante por plataforma: Metro elige `.native.ts` en Android y `.web.ts` en el navegador; `.d.ts` declara la interfaz común.
 */
export const hasSocialReturn: boolean;
export const socialBridge: {
  restore(): Promise<void>;
  start(
    provider: string,
    query: <T>(path: string, body: object) => Promise<T>,
  ): Promise<void>;
  pending(): { id: string; proof: string } | null;
  clear(): void;
  begin(): Promise<{ proof: string; challenge: string }>;
  redirect(id: string, url: string): void;
};
