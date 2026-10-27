/**
 * Contenedores que mantienen visibles los campos cuando aparece el teclado. Variante por plataforma: Metro elige `.native.tsx` en Android y `.web.tsx` en el navegador; `.d.ts` declara la interfaz común.
 */
import type { ReactNode, ForwardRefExoticComponent, RefAttributes } from "react";
import type { ScrollView, ScrollViewProps } from "react-native";
export function KeyboardRoot(props: { children: ReactNode }): ReactNode;
export const FormScrollView: ForwardRefExoticComponent<ScrollViewProps & RefAttributes<Pick<ScrollView, "scrollTo">>>;
