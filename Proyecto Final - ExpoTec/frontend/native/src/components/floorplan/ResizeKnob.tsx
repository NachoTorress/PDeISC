/** Manija para cambiar el tamaño de una mesa arrastrando una esquina o un borde. */
import { useMemo, useRef } from "react";
import { PanResponder, View } from "react-native";
import type { Furniture } from "../../lib/types";
import { resizeTable, type ResizeHandle } from "../../lib/resizeTable";
import { useGestureGuard } from "../../hooks/useGestureGuard";
import { useTheme } from "../../contexts/ThemeContext";
import { directions, type Geometry, type Size } from "./geometry";
import { styles } from "./styles";

/** Un tirador nativo conserva el gesto inicial y calcula el tamaño con la geometría compartida. */
export function ResizeKnob({
  item,
  handle,
  stage,
  x,
  y,
  onPreview,
  onCommit,
  onActive,
}: {
  item: Furniture;
  handle: ResizeHandle;
  stage: Size;
  x: number;
  y: number;
  onPreview: (geometry: Geometry | null) => void;
  onCommit: (geometry: Geometry) => void;
  onActive?: (active: boolean) => void;
}) {
  const { colors } = useTheme();
  const itemRef = useRef(item);
  itemRef.current = item;
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const origin = useRef(item);
  const result = useRef<Geometry | null>(null);
  const callbacks = useRef({ onPreview, onCommit });
  callbacks.current = { onPreview, onCommit };
  const guard = useGestureGuard(onActive, () => {
    result.current = null;
    callbacks.current.onPreview(null);
  });
  const guardRef = useRef(guard);
  guardRef.current = guard;
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          origin.current = itemRef.current;
          result.current = null;
          guardRef.current.begin();
        },
        onPanResponderMove: (_, gesture) => {
          if (!guardRef.current.isActive()) return;
          result.current = resizeTable(
            origin.current,
            handle,
            gesture.dx,
            gesture.dy,
            stageRef.current,
          );
          callbacks.current.onPreview(result.current);
        },
        onPanResponderRelease: () => {
          if (guardRef.current.isActive() && result.current)
            callbacks.current.onCommit(result.current);
          callbacks.current.onPreview(null);
          guardRef.current.end();
        },
        onPanResponderTerminate: () => guardRef.current.cancel(),
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
      }),
    [handle],
  );
  return (
    <View
      {...responder.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`Cambiar tamaño de ${item.id}, tirador ${handle}`}
      accessibilityHint="Arrastrá hacia adentro para achicar o hacia afuera para agrandar."
      accessibilityActions={[
        { name: "increment", label: "Agrandar mesa" },
        { name: "decrement", label: "Achicar mesa" },
      ]}
      onAccessibilityAction={(event) => {
        const direction = event.nativeEvent.actionName === "increment" ? 1 : -1;
        const [horizontal, vertical] = directions[handle];
        const radians = (item.rotation * Math.PI) / 180;
        callbacks.current.onCommit(
          resizeTable(
            item,
            handle,
            direction *
              8 *
              (horizontal * Math.cos(radians) - vertical * Math.sin(radians)),
            direction *
              8 *
              (horizontal * Math.sin(radians) + vertical * Math.cos(radians)),
            stage,
          ),
        );
      }}
      testID={`resize-knob-${handle}`}
      style={[styles.knobTouch, { left: x - 12, top: y - 12 }]}
    >
      <View
        style={[
          styles.knob,
          { backgroundColor: colors.surface, borderColor: colors.primary },
        ]}
      />
    </View>
  );
}
