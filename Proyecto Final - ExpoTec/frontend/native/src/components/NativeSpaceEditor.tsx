/** Panel de edición de la pieza seleccionada del plano (posición, giro, tamaño y texto). */
import { useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import type { Furniture, Space } from "../lib/types";
import { Button, Card, Field, InlineConfirm } from "./ui";
import FurnitureTransformControls from "./FurnitureTransformControls";

/** Edita el borrador del espacio. El plano guarda los cambios cuando administración confirma. */
export default function NativeSpaceEditor({
  space,
  selected,
  onChange,
  onSelect,
  protectedFurnitureIds = [],
}: {
  space: Space;
  selected: string | null;
  onChange: (space: Space) => void;
  onSelect: (id: string | null) => void;
  protectedFurnitureIds?: string[];
}) {
  const { colors } = useTheme();
  const [confirm, setConfirm] = useState<string | null>(null);
  const [details, setDetails] = useState(false);
  const { width } = useWindowDimensions();
  const compact = width < 900;
  const current = space.furniture.find((item) => item.id === selected);
  const used = current && protectedFurnitureIds.includes(current.id);
  const labelError =
    current?.type === "label" && (current.text?.trim().length ?? 0) < 2
      ? "Escribí al menos 2 caracteres para identificar la zona."
      : "";
  /** Aplica un cambio parcial a la pieza. */
  function update(changes: Partial<Furniture>) {
    if (!current) return;
    onChange({
      ...space,
      furniture: space.furniture.map((item) =>
        item.id === current.id ? { ...item, ...changes } : item,
      ),
    });
  }
  return (
    <Card>
      {current && (
        <View testID="selected-furniture-properties" style={{ gap: 10 }}>
          <Text style={{ color: colors.text, fontWeight: "700" }}>
            {current.type === "table"
              ? "Mesa"
              : current.type === "bench"
                ? "Banco"
                : current.type === "label"
                  ? "Etiqueta"
                  : "Punto eléctrico"}{" "}
            · {current.id}
          </Text>
          <FurnitureTransformControls
            key={current.id}
            item={current}
            onChange={update}
          />
          {current.type === "label" && (
            <Field
              label="Texto de la etiqueta"
              value={current.text ?? ""}
              onChangeText={(text) => update({ text })}
              maxLength={60}
              error={labelError}
              hint="Por ejemplo: Entrada, Robótica o Zona de descanso."
            />
          )}
          {current.type === "table" && (
            <Text style={{ color: colors.muted, lineHeight: 21 }}>
              {compact
                ? "Arrastrá la mesa para moverla. Ajustá ancho y fondo con los botones."
                : "Arrastrá la mesa para moverla o usá sus tiradores para cambiar el tamaño."}
            </Text>
          )}
          {used ? (
            <Text style={{ color: colors.muted, lineHeight: 21 }}>
              Este puesto tiene proyectos asociados y debe conservarse.
            </Text>
          ) : confirm === current.id ? (
            <InlineConfirm
              text="¿Seguro que querés quitar este elemento del plano?"
              confirmLabel="Quitar elemento"
              onCancel={() => setConfirm(null)}
              onConfirm={() => {
                onChange({
                  ...space,
                  furniture: space.furniture.filter(
                    (item) => item.id !== current.id,
                  ),
                });
                onSelect(null);
                setConfirm(null);
              }}
            />
          ) : (
            <Button
              title="Quitar del plano"
              icon="trash"
              variant="danger"
              onPress={() => setConfirm(current.id)}
            />
          )}
        </View>
      )}
      {!current && (
        <Text style={{ color: colors.muted, lineHeight: 21 }}>
          Tocá una pieza para moverla, girarla o cambiar su tamaño.
        </Text>
      )}
      <View style={[styles.selected, { borderColor: colors.outline }]}>
        {compact && (
          <Button
            title={
              details
                ? "Cerrar datos del espacio"
                : "Editar nombre y descripción"
            }
            variant="quiet"
            icon="edit"
            onPress={() => setDetails(!details)}
          />
        )}
        {(!compact || details) && (
          <>
            <Text
              style={{ color: colors.text, fontSize: 18, fontWeight: "600" }}
            >
              Propiedades del espacio
            </Text>
            <Field
              label="Nombre del espacio"
              value={space.name}
              onChangeText={(name) => onChange({ ...space, name })}
              maxLength={80}
              error={
                space.name.trim().length < 2
                  ? "El nombre necesita al menos 2 caracteres."
                  : ""
              }
            />
            <Field
              label="Descripción"
              value={space.description}
              onChangeText={(description) =>
                onChange({ ...space, description })
              }
              maxLength={150}
            />
          </>
        )}
      </View>
      <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
        Los puntos eléctricos indican ubicaciones. La instalación debe revisarla
        personal habilitado.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  selected: { borderTopWidth: 1, paddingTop: 12, gap: 10 },
});
