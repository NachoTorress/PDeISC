/**
 * Almacenamiento del token de renovación. Variante por plataforma: Metro elige `.native.ts` en Android y `.web.ts` en el navegador; `.d.ts` declara la interfaz común.
 */
import type { SessionStorage } from "./authTypes";
export declare const sessionStorage: SessionStorage;
