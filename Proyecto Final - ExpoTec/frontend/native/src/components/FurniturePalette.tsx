/**
 * Paleta del editor de planos: arrastrar mesas, bancos, puntos eléctricos y rótulos al plano, o ubicarlos con botones accesibles.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { PanResponder, Platform, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useGestureGuard } from "../hooks/useGestureGuard";
import {
  dropPosition,
  finishFurnitureDrop,
  furnitureId,
  furnitureSize,
  paletteFurniture,
} from "../lib/furnitureDrop";
import type { PaletteDrag, Point, WindowRect } from "../lib/furnitureDrop";
import { newId } from "../lib/helpers";
import type { Furniture, Space } from "../lib/types";
import { Icon } from "./Icon";

const tools: { type: Furniture["type"]; label: string; fullLabel: string }[] = [
  { type: "table", label: "Mesa", fullLabel: "mesa" },
  { type: "bench", label: "Banco", fullLabel: "banco" },
  { type: "power", label: "Toma", fullLabel: "punto eléctrico" },
  { type: "label", label: "Zona", fullLabel: "etiqueta de zona" },
];
type ToolProps = {
  type: Furniture["type"];
  label: string;
  fullLabel: string;
  active: boolean;
  onStart: (point: Point) => void;
  onMove: (point: Point) => void;
  onEnd: (point: Point) => Promise<void>;
  onCancel: () => void;
  onPlaceAccessible: () => void;
  onActive: (active: boolean) => void;
};

/** Pieza arrastrable de la paleta. */
function PaletteTool({
  type,
  label,
  fullLabel,
  active,
  onStart,
  onMove,
  onEnd,
  onCancel,
  onPlaceAccessible,
  onActive,
}: ToolProps) {
  const { colors } = useTheme();
  const callbacks = useRef({
    onStart,
    onMove,
    onEnd,
    onCancel,
    onPlaceAccessible,
  });
  callbacks.current = { onStart, onMove, onEnd, onCancel, onPlaceAccessible };
  const guard = useGestureGuard(onActive, () => callbacks.current.onCancel());
  const guardRef = useRef(guard);
  guardRef.current = guard;
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          guardRef.current.begin();
          callbacks.current.onStart({
            x: event.nativeEvent.pageX,
            y: event.nativeEvent.pageY,
          });
        },
        onPanResponderMove: (_, gesture) => {
          if (guardRef.current.isActive())
            callbacks.current.onMove({ x: gesture.moveX, y: gesture.moveY });
        },
        onPanResponderRelease: (event, gesture) => {
          if (!guardRef.current.isActive()) return;
          const point = {
            x: gesture.moveX || event.nativeEvent.pageX,
            y: gesture.moveY || event.nativeEvent.pageY,
          };
          void callbacks.current
            .onEnd(point)
            .catch(() => callbacks.current.onCancel())
            .finally(() => guardRef.current.end());
        },
        onPanResponderTerminate: () => guardRef.current.cancel(),
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
      }),
    [],
  );
  const keyboardProps =
    Platform.OS === "web"
      ? {
          onKeyDown: (event: { key: string; preventDefault: () => void }) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              if (!guardRef.current.isActive())
                callbacks.current.onPlaceAccessible();
            }
          },
        }
      : {};
  return (
    <View
      {...responder.panHandlers}
      {...keyboardProps}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Arrastrar ${fullLabel} al plano`}
      accessibilityHint="Mantené presionado y arrastrá al plano. Con lector de pantalla podés usar Colocar en el centro."
      accessibilityActions={[
        {
          name: "activate",
          label: `Colocar ${fullLabel} en el centro del plano`,
        },
      ]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "activate")
          callbacks.current.onPlaceAccessible();
      }}
      onAccessibilityTap={onPlaceAccessible}
      style={[
        styles.tool,
        {
          backgroundColor: active ? colors.surfaceVariant : colors.surface,
          borderColor: active ? colors.primary : colors.outline,
        },
      ]}
    >
      <Icon name={type} size={22} color={colors.text} />
      <Text
        selectable={false}
        numberOfLines={1}
        style={{ color: colors.text, fontSize: 12, textAlign: "center" }}
      >
        {label}
      </Text>
    </View>
  );
}

/** Mide la posición del plano en la ventana para calcular dónde se soltó la pieza. */
function measure(ref: RefObject<View | null>): Promise<WindowRect | null> {
  return new Promise((resolve) => {
    const node = ref.current;
    if (!node) {
      resolve(null);
      return;
    }
    node.measureInWindow((x, y, width, height) =>
      resolve(width > 4 && height > 4 ? { x, y, width, height } : null),
    );
  });
}

/** Paleta táctil: ninguna pulsación crea piezas; el destino se mide de nuevo al soltar. */
export default function FurniturePalette({
  canvasRef,
  space,
  onAdd,
  onGestureActiveChange,
}: {
  canvasRef: RefObject<View | null>;
  space: Space;
  onAdd: (furniture: Furniture) => void;
  onGestureActiveChange?: (active: boolean) => void;
}) {
  const { colors } = useTheme();
  const host = useRef<View>(null);
  const session = useRef<PaletteDrag | null>(null);
  const current = useRef({ space, onAdd });
  current.current = { space, onAdd };
  const [active, setActive] = useState<Furniture["type"] | null>(null);
  const [preview, setPreview] = useState<{
    point: Point;
    canvas: WindowRect;
    host: WindowRect;
    type: Furniture["type"];
  } | null>(null);
  const cancel = useCallback(() => {
    session.current = null;
    setActive(null);
    setPreview(null);
  }, []);
  /** Actualiza la vista previa mientras se arrastra. */
  async function updatePreview() {
    const drag = session.current;
    if (!drag) return;
    const [canvas, hostRect] = await Promise.all([
      measure(canvasRef),
      measure(host),
    ]);
    if (session.current !== drag || !canvas || !hostRect) return;
    setPreview({ point: drag.end, canvas, host: hostRect, type: drag.type });
  }
  /** Termina el arrastre y agrega la pieza si se soltó dentro del plano. */
  async function end(point: Point) {
    const drag = session.current;
    if (!drag) return;
    drag.end = point;
    const canvas = await measure(canvasRef);
    if (session.current !== drag || !canvas) {
      cancel();
      return;
    }
    const furniture = finishFurnitureDrop(
      current.current.space,
      drag,
      canvas,
      newId,
    );
    if (furniture) current.current.onAdd(furniture);
    cancel();
  }
  /** Alternativa sin arrastre: agrega la pieza en un lugar libre. */
  async function placeAccessible(type: Furniture["type"]) {
    const canvas = await measure(canvasRef);
    if (!canvas) return;
    const item = paletteFurniture(type);
    const position = dropPosition(
      { x: canvas.x + canvas.width / 2, y: canvas.y + canvas.height / 2 },
      canvas,
      item,
    );
    if (position)
      current.current.onAdd({
        ...item,
        ...position,
        id: furnitureId(current.current.space, type, newId()),
      });
  }
  const item = preview ? paletteFurniture(preview.type) : null;
  const position =
    preview && item ? dropPosition(preview.point, preview.canvas, item) : null;
  const size = preview && item ? furnitureSize(item, preview.canvas) : null;
  const ghostPoint = preview
    ? position
      ? {
          x: preview.canvas.x + (position.x / 100) * preview.canvas.width,
          y: preview.canvas.y + (position.y / 100) * preview.canvas.height,
        }
      : preview.point
    : null;
  return (
    <View ref={host} collapsable={false} style={styles.palette}>
      <View style={styles.tools}>
        {tools.map((tool) => (
          <PaletteTool
            key={tool.type}
            {...tool}
            active={active === tool.type}
            onActive={(activeGesture) => onGestureActiveChange?.(activeGesture)}
            onStart={(point) => {
              session.current = { type: tool.type, start: point, end: point };
              setActive(tool.type);
              void updatePreview();
            }}
            onMove={(point) => {
              if (!session.current) return;
              session.current.end = point;
              void updatePreview();
            }}
            onEnd={end}
            onCancel={cancel}
            onPlaceAccessible={() => {
              void placeAccessible(tool.type);
            }}
          />
        ))}
      </View>
      <Text
        selectable={false}
        numberOfLines={2}
        accessibilityLiveRegion="polite"
        style={{
          minHeight: 36,
          color: active
            ? position
              ? colors.primary
              : colors.muted
            : colors.muted,
          fontSize: 13,
          lineHeight: 18,
        }}
      >
        {active
          ? position
            ? "Soltá para colocar."
            : "Llevá la pieza al plano. Soltar afuera cancela."
          : "Mantené una pieza y arrastrala al plano."}
      </Text>
      {preview && size && ghostPoint && (
        <View
          pointerEvents="none"
          style={[
            styles.ghost,
            {
              left: ghostPoint.x - preview.host.x - size.width / 2,
              top: ghostPoint.y - preview.host.y - size.height / 2,
              width: size.width,
              height: size.height,
              backgroundColor: colors.surface,
              borderColor: position ? colors.primary : colors.error,
            },
          ]}
        >
          {preview.type === "label" ? (
            <Text
              selectable={false}
              style={{ color: colors.text, fontSize: 12 }}
            >
              Nueva zona
            </Text>
          ) : (
            <Icon
              name={preview.type}
              size={Math.max(12, Math.min(22, size.height - 4))}
              color={position ? colors.primary : colors.error}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  palette: { gap: 8, zIndex: 80 },
  tools: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tool: {
    minWidth: 48,
    minHeight: 56,
    flex: 1,
    flexBasis: 48,
    padding: 6,
    gap: 5,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  ghost: {
    position: "absolute",
    zIndex: 100,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 4,
    opacity: 0.85,
    alignItems: "center",
    justifyContent: "center",
  },
});
