/** Pieza del plano (mesa, banco, toma o rótulo) que se selecciona y se mueve con gestos. */
import { useMemo, useRef, useState } from "react";
import { PanResponder, Pressable, Text, View } from "react-native";
import type { Furniture, Project } from "../../lib/types";
import { useGestureGuard } from "../../hooks/useGestureGuard";
import { useTheme } from "../../contexts/ThemeContext";
import { Icon } from "../Icon";
import { fitItem, sizeFor, type Size } from "./geometry";
import { styles } from "./styles";

/** Pieza del plano que se puede seleccionar y mover con gestos. */
export function MoveableItem({
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
}: {
  item: Furniture;
  stage: Size;
  editing: boolean;
  selected: boolean;
  project?: Pick<Project, "name">;
  pending: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onMoving: (moving: boolean) => void;
  booth?: boolean;
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
        ? `Puesto ${item.id}. ${project?.name ?? (pending ? "Solicitado" : "Disponible")}`
        : `Mesa ${item.id}. Solo mobiliario`
      : item.type === "label"
        ? `Zona: ${item.text ?? "Nueva zona"}`
        : item.type === "bench"
          ? "Banco"
          : "Punto eléctrico de referencia";
  return (
    <View
      {...responder.panHandlers}
      testID={`furniture-${item.id}`}
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
            ? "Arrastrá para mover. Los controles de la pieza permiten girar y cambiar su tamaño."
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
                    ? (project?.name ?? (pending ? "Solicitado" : "Disponible"))
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
