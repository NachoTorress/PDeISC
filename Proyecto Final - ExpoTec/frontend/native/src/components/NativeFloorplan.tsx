import { useEffect, useMemo, useRef, useState } from "react";
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Polygon } from "react-native-svg";
import type { Furniture, Project, Space } from "../lib/types";
import { furnitureSize } from "../lib/furnitureDrop";
import { floorplanSize } from "../lib/floorplanSize";
import { useGestureGuard } from "../hooks/useGestureGuard";
import FurniturePalette from "./FurniturePalette";
import { resizeTable, type ResizeHandle } from "../lib/resizeTable";
import { useTheme } from "../contexts/ThemeContext";
import { Icon } from "./Icon";

type Size = { width: number; height: number };
type Geometry = { x: number; y: number; width: number; height: number };
interface Props {
  space: Space;
  projects: Project[];
  editing: boolean;
  showPending?: boolean;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onFit: (positions: { id: string; x: number; y: number }[]) => void;
  onResize: (id: string, geometry: Geometry) => void;
  onAddFurniture?: (furniture: Furniture) => void;
  onGestureActiveChange?: (active: boolean) => void;
  shared?: boolean;
  boothFurnitureIds?: string[];
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const directions: Record<ResizeHandle, [number, number]> = {
  nw: [-1, -1],
  n: [0, -1],
  ne: [1, -1],
  e: [1, 0],
  se: [1, 1],
  s: [0, 1],
  sw: [-1, 1],
  w: [-1, 0],
};

/** Convierte el tamaño relativo guardado en píxeles, sin cambiar los datos del proyecto. */
function sizeFor(item: Furniture, stage: Size): Size {
  return furnitureSize(item, stage);
}

/** Incluye el giro en la huella del elemento para conservarlo dentro del plano. */
function fitItem(item: Furniture, stage: Size): { x: number; y: number } {
  const size = sizeFor(item, stage);
  const angle = (item.rotation * Math.PI) / 180;
  const halfX =
    (Math.abs(Math.cos(angle)) * size.width +
      Math.abs(Math.sin(angle)) * size.height) /
      2 +
    2;
  const halfY =
    (Math.abs(Math.sin(angle)) * size.width +
      Math.abs(Math.cos(angle)) * size.height) /
      2 +
    2;
  const minX = Math.min(50, (halfX / stage.width) * 100);
  const minY = Math.min(50, (halfY / stage.height) * 100);
  return {
    x: clamp(item.x, minX, 100 - minX),
    y: clamp(item.y, minY, 100 - minY),
  };
}

/** Mantiene todos los tiradores de 48 dp dentro del plano, con separación para cada giro. */
function knobsFor(item: Furniture, stage: Size) {
  const size = sizeFor(item, stage);
  const angle = (item.rotation * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  // 80 px entre esquinas también conserva más de 8 dp de hueco con un giro de 45°.
  const halfWidth = Math.max(size.width / 2 + 8, 40);
  const halfHeight = Math.max(size.height / 2 + 8, 40);
  const extentX = Math.abs(cos) * halfWidth + Math.abs(sin) * halfHeight;
  const extentY = Math.abs(sin) * halfWidth + Math.abs(cos) * halfHeight;
  const centerX = clamp(
    (item.x / 100) * stage.width,
    24 + extentX,
    stage.width - 24 - extentX,
  );
  const centerY = clamp(
    (item.y / 100) * stage.height,
    24 + extentY,
    stage.height - 24 - extentY,
  );
  function positions(handles: ResizeHandle[]) {
    return handles.map((handle) => {
      const [horizontal, vertical] = directions[handle];
      const localX = horizontal * halfWidth;
      const localY = vertical * halfHeight;
      return {
        handle,
        x: centerX + localX * cos - localY * sin,
        y: centerY + localX * sin + localY * cos,
      };
    });
  }
  if (stage.width >= 700) {
    const eight = positions(["nw", "n", "ne", "e", "se", "s", "sw", "w"]);
    const separated = eight.every((point, index) =>
      eight
        .slice(index + 1)
        .every(
          (other) =>
            Math.max(
              Math.abs(point.x - other.x),
              Math.abs(point.y - other.y),
            ) >= 56,
        ),
    );
    if (separated) return eight;
  }
  return positions(["nw", "ne", "se", "sw"]);
}

function MoveableItem({
  item,
  stage,
  editing,
  selected,
  project,
  pending,
  onSelect,
  onMove,
  onMoving,
  booth = true,
  shared = false,
}: {
  item: Furniture;
  stage: Size;
  editing: boolean;
  selected: boolean;
  project?: Project;
  pending: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onMoving: (moving: boolean) => void;
  booth?: boolean;
  shared?: boolean;
}) {
  const { colors } = useTheme();
  const [preview, setPreview] = useState<{ x: number; y: number } | null>(null);
  const start = useRef(item);
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const current = useRef(item);
  current.current = item;
  const committed = useRef<{ x: number; y: number } | null>(null);
  const callbacks = useRef({ onSelect, onMove, onMoving });
  callbacks.current = { onSelect, onMove, onMoving };
  const guard = useGestureGuard(
    (active) => callbacks.current.onMoving(active),
    () => {
      committed.current = null;
      setPreview(null);
    },
  );
  const guardRef = useRef(guard);
  guardRef.current = guard;
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => editing,
        onStartShouldSetPanResponderCapture: () => editing,
        onMoveShouldSetPanResponder: (_, gesture) =>
          editing && Math.abs(gesture.dx) + Math.abs(gesture.dy) > 3,
        onPanResponderGrant: () => {
          start.current = current.current;
          committed.current = null;
          guardRef.current.begin();
          callbacks.current.onSelect();
        },
        onPanResponderMove: (_, gesture) => {
          if (!guardRef.current.isActive()) return;
          const next = fitItem(
            {
              ...start.current,
              x: start.current.x + (gesture.dx / stageRef.current.width) * 100,
              y: start.current.y + (gesture.dy / stageRef.current.height) * 100,
            },
            stageRef.current,
          );
          committed.current = next;
          setPreview(next);
        },
        onPanResponderRelease: () => {
          const next = committed.current;
          if (guardRef.current.isActive() && next)
            callbacks.current.onMove(next.x, next.y);
          setPreview(null);
          guardRef.current.end();
        },
        onPanResponderTerminate: () => {
          guardRef.current.cancel();
        },
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
      }),
    [editing],
  );
  const size = sizeFor(item, stage);
  const touchSize = {
    width: Math.max(48, size.width),
    height: Math.max(48, size.height),
  };
  const position = preview ?? fitItem(item, stage);
  const background =
    item.type === "table"
      ? project
        ? colors.tableOccupied
        : pending
          ? colors.warning
          : colors.table
      : item.type === "label"
        ? colors.surface
        : colors.surfaceVariant;
  const label =
    item.type === "table"
      ? booth
        ? `Puesto ${item.id}. ${project?.name ?? (pending ? "Solicitado" : shared ? "Habilitado" : "Disponible")}`
        : `Mesa ${item.id}. Solo mobiliario`
      : item.type === "label"
        ? `Zona: ${item.text ?? "Nueva zona"}`
        : item.type === "bench"
          ? "Banco"
          : "Punto eléctrico de referencia";
  return (
    <View
      {...responder.panHandlers}
      style={[
        styles.furniturePosition,
        {
          left: (position.x / 100) * stage.width - touchSize.width / 2,
          top: (position.y / 100) * stage.height - touchSize.height / 2,
          width: touchSize.width,
          height: touchSize.height,
          transform: [{ rotate: `${item.rotation}deg` }],
          zIndex: selected ? 20 : item.type === "label" ? 8 : 5,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        accessibilityHint={
          editing
            ? "Arrastrá para mover. Los tiradores cambian el tamaño de una mesa."
            : "Muestra los detalles del elemento."
        }
        onPress={onSelect}
        style={styles.itemTouch}
      >
        <View
          style={[
            styles.furniture,
            {
              width: size.width,
              height: size.height,
              backgroundColor: background,
              borderColor: selected ? colors.primary : colors.tableEdge,
              borderWidth: selected ? 2 : 1,
              borderRadius:
                item.type === "label" ? 6 : item.type === "power" ? 16 : 4,
            },
          ]}
        >
          {item.type === "table" ? (
            <>
              <Text
                selectable={false}
                numberOfLines={1}
                style={{
                  color: colors.text,
                  fontSize: size.width < 56 ? 8 : 11,
                  fontWeight: "700",
                }}
              >
                {item.id}
              </Text>
              {size.height >= 45 && (
                <Text
                  selectable={false}
                  numberOfLines={1}
                  style={{ color: colors.muted, fontSize: 10 }}
                >
                  {booth
                    ? (project?.name ??
                      (pending
                        ? "Solicitado"
                        : shared
                          ? "Habilitado"
                          : "Disponible"))
                    : "Mesa"}
                </Text>
              )}
              {booth && (
                <View
                  style={[
                    styles.occupiedDot,
                    {
                      backgroundColor: project
                        ? colors.primary
                        : pending
                          ? colors.onWarning
                          : colors.outline,
                    },
                  ]}
                />
              )}
            </>
          ) : item.type === "power" ? (
            <Icon name="power" size={22} color={colors.text} />
          ) : (
            <Text
              selectable={false}
              numberOfLines={1}
              style={{
                color: colors.text,
                fontSize: 12,
                fontWeight: item.type === "label" ? "600" : "400",
              }}
            >
              {item.type === "label" ? item.text || "Nueva zona" : "Banco"}
            </Text>
          )}
        </View>
      </Pressable>
    </View>
  );
}

/** Un tirador nativo conserva el gesto inicial y calcula el tamaño con la geometría compartida. */
function ResizeKnob({
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
      style={[styles.knobTouch, { left: x - 24, top: y - 24 }]}
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

/** Plano compartido por invitados y administración. Los gestos solo cambian el borrador al soltar. */
export default function NativeFloorplan({
  space,
  projects,
  editing,
  showPending = true,
  selected,
  onSelect,
  onMove,
  onFit,
  onResize,
  onAddFurniture,
  onGestureActiveChange,
  shared = false,
  boothFurnitureIds,
}: Props) {
  const { colors } = useTheme();
  const viewport = useWindowDimensions();
  const canvasRef = useRef<View>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const stage = useMemo(
    () =>
      floorplanSize(containerWidth ?? 320, {
        width: viewport.width,
        height: viewport.height,
      }),
    [containerWidth, viewport.width, viewport.height],
  );
  const [moving, setMoving] = useState(false);
  const [resizePreview, setResizePreview] = useState<Geometry | null>(null);
  const selectedTable = editing
    ? space.furniture.find(
        (item) => item.id === selected && item.type === "table",
      )
    : undefined;
  const displayed =
    selectedTable && resizePreview
      ? { ...selectedTable, ...resizePreview }
      : selectedTable;
  const knobs = displayed && !moving ? knobsFor(displayed, stage) : [];
  useEffect(() => {
    if (!editing || containerWidth === null) return;
    const changes = space.furniture.flatMap((item) => {
      const next = fitItem(item, stage);
      return Math.abs(next.x - item.x) + Math.abs(next.y - item.y) > 0.02
        ? [{ id: item.id, ...next }]
        : [];
    });
    if (changes.length) onFit(changes);
  }, [space, stage, editing, onFit, containerWidth]);
  return (
    <View
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;
        if (width <= 4 || !Number.isFinite(width)) return;
        const nextWidth = Math.round(width);
        setContainerWidth((current) =>
          current === nextWidth ? current : nextWidth,
        );
      }}
      style={{ gap: 8 }}
    >
      {editing && onAddFurniture ? (
        <FurniturePalette
          canvasRef={canvasRef}
          space={space}
          onAdd={onAddFurniture}
          onGestureActiveChange={onGestureActiveChange}
        />
      ) : (
        <Text selectable={false} style={{ color: colors.muted, fontSize: 12 }}>
          {shared
            ? "Seleccioná un elemento para consultar sus detalles."
            : "Tocá una mesa para ver su proyecto o disponibilidad."}
        </Text>
      )}
      <View
        ref={canvasRef}
        collapsable={false}
        style={[
          styles.stage,
          {
            backgroundColor: colors.canvas,
            borderColor: colors.tableEdge,
            height: stage.height,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Deseleccionar elemento del plano"
          onPress={() => onSelect(null)}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={styles.planCaption}>
          <Text
            selectable={false}
            style={{ color: colors.muted, fontSize: 10 }}
          >
            {shared
              ? editing
                ? "Borrador del plano"
                : "Distribución guardada"
              : "Distribución de ejemplo"}
          </Text>
          <Text
            selectable={false}
            style={{ color: colors.muted, fontSize: 10 }}
          >
            Vista superior
          </Text>
        </View>
        {!shared && (
          <View
            pointerEvents="none"
            style={[styles.walkway, { borderColor: colors.outline }]}
          >
            <Text
              selectable={false}
              style={{ color: colors.muted, fontSize: 10 }}
            >
              Circulación
            </Text>
          </View>
        )}
        {space.furniture.map((item) => {
          const project = projects.find(
            (entry) =>
              entry.spaceId === space.id &&
              entry.furnitureId === item.id &&
              entry.status === "approved",
          );
          const pending =
            !project &&
            projects.some(
              (entry) =>
                entry.spaceId === space.id &&
                entry.furnitureId === item.id &&
                entry.status === "pending",
            );
          return (
            <MoveableItem
              key={item.id}
              item={displayed?.id === item.id ? displayed : item}
              stage={stage}
              editing={editing}
              selected={selected === item.id}
              project={project}
              pending={pending}
              booth={
                boothFurnitureIds ? boothFurnitureIds.includes(item.id) : true
              }
              shared={shared}
              onSelect={() => onSelect(item.id)}
              onMove={(x, y) => onMove(item.id, x, y)}
              onMoving={(active) => {
                setMoving(active);
                onGestureActiveChange?.(active);
              }}
            />
          );
        })}
        {knobs.length > 0 && (
          <Svg
            pointerEvents="none"
            width={stage.width}
            height={stage.height}
            style={[StyleSheet.absoluteFill, { zIndex: 30 }]}
          >
            <Polygon
              points={knobs.map(({ x, y }) => `${x},${y}`).join(" ")}
              fill="none"
              stroke={colors.primary}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          </Svg>
        )}
        {displayed &&
          knobs.map(({ handle, x, y }) => (
            <ResizeKnob
              key={`${displayed.id}-${handle}`}
              item={displayed}
              handle={handle}
              stage={stage}
              x={x}
              y={y}
              onPreview={setResizePreview}
              onActive={onGestureActiveChange}
              onCommit={(geometry) => onResize(displayed.id, geometry)}
            />
          ))}
        {!shared && (
          <View
            pointerEvents="none"
            style={[styles.entrance, { backgroundColor: colors.canvas }]}
          >
            <View
              style={{ flexDirection: "row", gap: 4, alignItems: "center" }}
            >
              <Icon name="arrowDown" color={colors.muted} size={14} />
              <Text
                selectable={false}
                style={{ color: colors.muted, fontSize: 11 }}
              >
                Entrada
              </Text>
            </View>
          </View>
        )}
      </View>
      <View style={styles.legend}>
        {(shared
          ? [
              {
                label: "Puestos habilitados · ver detalle",
                color: colors.table,
              },
            ]
          : [
              { label: "Disponible", color: colors.table },
              { label: "Ocupado", color: colors.tableOccupied },
              ...(showPending
                ? [{ label: "Solicitado", color: colors.warning }]
                : []),
            ]
        ).map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: item.color,
                borderColor: colors.tableEdge,
                borderWidth: 1,
              }}
            />
            <Text
              selectable={false}
              style={{ color: colors.muted, fontSize: 12 }}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    position: "relative",
    width: "100%",
    borderWidth: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  furniturePosition: { position: "absolute" },
  furniture: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  itemTouch: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  occupiedDot: {
    position: "absolute",
    right: 3,
    top: 3,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  planCaption: {
    position: "absolute",
    top: 9,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  walkway: {
    position: "absolute",
    left: "42%",
    top: "42%",
    width: "16%",
    height: "46%",
    borderStyle: "dashed",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    alignItems: "center",
    paddingTop: 9,
  },
  entrance: {
    position: "absolute",
    bottom: 0,
    left: "40%",
    width: "20%",
    alignItems: "center",
    paddingVertical: 6,
  },
  knobTouch: {
    position: "absolute",
    zIndex: 40,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  knob: { width: 15, height: 15, borderWidth: 2, borderRadius: 3 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
});
