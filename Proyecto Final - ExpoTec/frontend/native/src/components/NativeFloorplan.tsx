/**
 * Plano interactivo de un espacio: muestra mesas, bancos, puntos eléctricos y
 * rótulos; en modo edición permite moverlos, girarlos y cambiar su tamaño con
 * gestos o con controles accesibles. Los puestos muestran su estado con texto
 * e íconos, no solo con color.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Polygon } from "react-native-svg";
import type { Furniture, Project, Space } from "../lib/types";
import { furnitureSelection } from "../lib/floorplanSelection";
import { floorplanSize } from "../lib/floorplanSize";
import FurniturePalette from "./FurniturePalette";
import { useTheme } from "../contexts/ThemeContext";
import { Icon } from "./Icon";
import { fitItem, type Geometry } from "./floorplan/geometry";
import { MoveableItem } from "./floorplan/MoveableItem";
import { ResizeKnob } from "./floorplan/ResizeKnob";
import { SelectionStepper } from "./floorplan/SelectionStepper";
import { FloorplanLegend } from "./floorplan/FloorplanLegend";
import { styles } from "./floorplan/styles";

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
  occupiedBooths?: { furnitureId: string; name: string }[];
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
  occupiedBooths = [],
}: Props) {
  const { colors } = useTheme();
  const viewport = useWindowDimensions();
  const canvasRef = useRef<View>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const stage = useMemo(
    () =>
      floorplanSize(
        containerWidth ?? 320,
        {
          width: viewport.width,
          height: viewport.height,
        },
        editing,
      ),
    [containerWidth, viewport.width, viewport.height, editing],
  );
  const [moving, setMoving] = useState(false);
  const [resizePreview, setResizePreview] = useState<Geometry | null>(null);
  const selectedFurniture = editing
    ? space.furniture.find((item) => item.id === selected)
    : undefined;
  const displayed =
    selectedFurniture && resizePreview
      ? { ...selectedFurniture, ...resizePreview }
      : selectedFurniture;
  const selectionItem = displayed
    ? { ...displayed, ...fitItem(displayed, stage) }
    : undefined;
  const outline =
    selectionItem && !moving ? furnitureSelection(selectionItem, stage) : [];
  const knobs =
    selectionItem?.type === "table" && viewport.width >= 900 && !moving
      ? furnitureSelection(selectionItem, stage)
      : [];
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
      {editing && viewport.width < 900 && (
        <SelectionStepper
          furniture={space.furniture}
          selectedId={selected}
          onSelect={onSelect}
        />
      )}
      <View
        ref={canvasRef}
        testID="floorplan-stage"
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
          const project =
            occupiedBooths.find((entry) => entry.furnitureId === item.id) ??
            projects.find(
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
              onSelect={() => onSelect(item.id)}
              onMove={(x, y) => onMove(item.id, x, y)}
              onMoving={(active) => {
                setMoving(active);
                onGestureActiveChange?.(active);
              }}
            />
          );
        })}
        {outline.length > 0 && (
          <Svg
            pointerEvents="none"
            width={stage.width}
            height={stage.height}
            style={[StyleSheet.absoluteFill, { zIndex: 30 }]}
          >
            <Polygon
              points={outline.map(({ x, y }) => `${x},${y}`).join(" ")}
              fill="none"
              stroke={colors.primary}
              strokeWidth={2}
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
      <FloorplanLegend shared={shared} showPending={showPending} />
    </View>
  );
}
