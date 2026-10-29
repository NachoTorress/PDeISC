/** Android: usa react-native-keyboard-controller para desplazar el formulario sobre el teclado. */
import { forwardRef, useImperativeHandle, useRef } from "react";
import type { ReactNode } from "react";
import type { ScrollView, ScrollViewProps } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardProvider,
} from "react-native-keyboard-controller";
import type { KeyboardAwareScrollViewRef } from "react-native-keyboard-controller";

/** Proveedor del controlador de teclado. */
export function KeyboardRoot({ children }: { children: ReactNode }) {
  return (
    <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
      {children}
    </KeyboardProvider>
  );
}

/** ScrollView que desplaza el campo enfocado por encima del teclado. */
export const FormScrollView = forwardRef<
  Pick<ScrollView, "scrollTo">,
  ScrollViewProps
>(function FormScrollView(props, ref) {
  const scroll = useRef<KeyboardAwareScrollViewRef>(null);
  useImperativeHandle(ref, () => ({
    scrollTo: (options) => scroll.current?.scrollTo(options),
  }));
  return <KeyboardAwareScrollView {...props} ref={scroll} bottomOffset={24} />;
});
