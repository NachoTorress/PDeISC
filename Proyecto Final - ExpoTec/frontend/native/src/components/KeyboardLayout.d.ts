import type { ReactNode, ForwardRefExoticComponent, RefAttributes } from "react";
import type { ScrollView, ScrollViewProps } from "react-native";
export function KeyboardRoot(props: { children: ReactNode }): ReactNode;
export const FormScrollView: ForwardRefExoticComponent<ScrollViewProps & RefAttributes<Pick<ScrollView, "scrollTo">>>;
