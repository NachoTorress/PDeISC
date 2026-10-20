import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import type { Furniture, Space } from "../lib/types";
import { Button, Card, Field, InlineConfirm } from "./ui";

function RotationControl({
  rotation,
  onChange,
}: {
  rotation: number;
  onChange: (rotation: number) => void;
}) {
  const [angle, setAngle] = useState(String(rotation));
  const valid = /^\d{1,3}$/.test(angle) && Number(angle) <= 360;
  return (
    <View style={{ gap: 8 }}>
      <Field
        label="Giro en grados"
        value={angle}
        onChangeText={setAngle}
        keyboardType="number-pad"
        maxLength={3}
        error={valid ? undefined : "Ingresá un número entero entre 0 y 360."}
        hint="Elegí cualquier ángulo y pulsá Aplicar giro. 360° equivale a 0°."
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button
          title="Aplicar giro"
          icon="rotate"
          variant="secondary"
          disabled={!valid || Number(angle) % 360 === rotation}
          onPress={() => onChange(Number(angle) % 360)}
        />
        <Button
          title="−15°"
          variant="quiet"
          onPress={() => onChange((rotation + 345) % 360)}
        />
        <Button
          title="+15°"
          variant="quiet"
          onPress={() => onChange((rotation + 15) % 360)}
        />
      </View>
    </View>
  );
}

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
  const current = space.furniture.find((item) => item.id === selected);
  const used = current && protectedFurnitureIds.includes(current.id);
  const labelError =
    current?.type === "label" && (current.text?.trim().length ?? 0) < 2
      ? "Escribí al menos 2 caracteres para identificar la zona."
      : "";
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
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: "600" }}>
        Propiedades del espacio
      </Text>
      <Text style={{ color: colors.muted, lineHeight: 22 }}>
        Seleccioná una pieza del plano para moverla, girarla o editarla.
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
        onChangeText={(description) => onChange({ ...space, description })}
        maxLength={150}
      />
      {current && (
        <View style={[styles.selected, { borderColor: colors.outline }]}>
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
          <RotationControl
            key={`${current.id}:${current.rotation}`}
            rotation={current.rotation}
            onChange={(rotation) => update({ rotation })}
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
              Arrastrá un tirador hacia adentro para achicar o hacia afuera para
              agrandar.
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
