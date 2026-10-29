/** Pantalla desplazable con márgenes responsivos y botón para volver arriba. */
import { useRef, useState } from "react";
import type { ReactNode, Ref } from "react";
import { Platform, ScrollView, View, useWindowDimensions } from "react-native";
import type { ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { layout } from "../../theme/tokens";
import { FormScrollView } from "../KeyboardLayout";
import { Button } from "./Button";

// Reservar la barra evita que bloquear el scroll cambie el ancho durante un gesto.
const scrollLayoutStyle: ViewStyle & { scrollbarGutter?: string } =
  Platform.OS === "web" ? { scrollbarGutter: "stable" } : {};

/** Pantalla desplazable con márgenes responsivos y botón para volver arriba. */
export function Screen({
  children,
  scrollEnabled = true,
  scrollRef,
}: {
  children: ReactNode;
  scrollEnabled?: boolean;
  scrollRef?: Ref<Pick<ScrollView, "scrollTo">>;
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const scroll = useRef<Pick<ScrollView, "scrollTo">>(null);
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const [showTop, setShowTop] = useState(false);
  return (
    <View style={{ flex: 1, backgroundColor: colors.page }}>
      <FormScrollView
        ref={(node) => {
          scroll.current = node;
          if (typeof scrollRef === "function") scrollRef(node);
          else if (scrollRef) scrollRef.current = node;
        }}
        style={[{ flex: 1, minHeight: 0 }, scrollLayoutStyle]}
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={160}
        onScroll={(e) => setShowTop(e.nativeEvent.contentOffset.y > 550)}
        contentContainerStyle={{
          paddingHorizontal:
            width >= 1200 ? layout.pagePadding : width > 700 ? 24 : 16,
          paddingTop: width > 700 ? 24 : 16,
          paddingBottom: 24 + insets.bottom,
          gap: 16,
          flexGrow: 1,
        }}
      >
        {children}
      </FormScrollView>
      {showTop && (
        <Button
          title="Subir"
          icon="arrowUp"
          variant="secondary"
          onPress={() =>
            scroll.current?.scrollTo({ y: 0, animated: !reducedMotion })
          }
          style={{
            position: "absolute",
            right: 18,
            bottom: 14,
            borderWidth: 1,
            borderColor: colors.outline,
          }}
        />
      )}
    </View>
  );
}
