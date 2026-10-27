/** Web: ajusta el alto visible cuando el teclado virtual del teléfono se abre. */
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import type { ScrollViewProps } from "react-native";

/** Escucha el viewport visual del navegador. */
export function KeyboardRoot({ children }: { children: ReactNode }) {
  const [height, setHeight] = useState<number>();
  useEffect(() => {
    const viewport = window.visualViewport;
    let frame = 0;
    const resize = () => {
      setHeight(viewport?.height ?? window.innerHeight);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const input = document.activeElement;
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)
          input.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
    };
    resize();
    viewport?.addEventListener("resize", resize);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", resize);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <View style={{ flex: 1, minHeight: 0, height, maxHeight: height }}>{children}</View>;
}

/** ScrollView común con referencia para desplazar. */
export const FormScrollView = forwardRef<Pick<ScrollView, "scrollTo">, ScrollViewProps>(
  function FormScrollView(props, ref) {
    const scroll = useRef<ScrollView>(null);
    useImperativeHandle(ref, () => ({ scrollTo: (options) => scroll.current?.scrollTo(options) }));
    return <ScrollView {...props} ref={scroll} />;
  },
);
