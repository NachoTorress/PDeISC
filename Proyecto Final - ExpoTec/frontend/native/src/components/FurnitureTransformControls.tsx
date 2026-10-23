import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { adjustedTableSize, rotatedFurniture } from "../lib/furnitureControls";
import { TABLE_LIMITS, TABLE_SIZE } from "../lib/layout";
import type { Furniture } from "../lib/types";
import { Button, Field } from "./ui";

export default function FurnitureTransformControls({
  item,
  onChange,
}: {
  item: Furniture;
  onChange: (changes: Partial<Furniture>) => void;
}) {
  const { colors } = useTheme();
  const [exact, setExact] = useState(false);
  const [angle, setAngle] = useState(String(item.rotation));
  useEffect(() => setAngle(String(item.rotation)), [item.rotation]);
  const valid = /^\d{1,3}$/.test(angle) && Number(angle) <= 360;
  return (
    <View testID="furniture-transform-controls" style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: colors.text, fontWeight: "600", flex: 1 }}
        >
          Giro · {item.rotation}°
        </Text>
        <Button
          title={exact ? "Cerrar ángulo exacto" : "Ángulo exacto"}
          variant="quiet"
          style={{ minWidth: 0, paddingHorizontal: 6 }}
          onPress={() => setExact(!exact)}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {[-15, 15, 90].map((delta) => (
          <Button
            key={delta}
            title={`${delta < 0 ? "−" : "+"}${Math.abs(delta)}°`}
            accessibilityLabel={`Girar ${Math.abs(delta)} grados ${delta < 0 ? "a la izquierda" : "a la derecha"}`}
            variant="secondary"
            style={{ flex: 1, minWidth: 0, paddingHorizontal: 6 }}
            onPress={() =>
              onChange({ rotation: rotatedFurniture(item.rotation, delta) })
            }
          />
        ))}
      </View>
      {exact && (
        <View style={{ gap: 8 }}>
          <Field
            label="Giro en grados"
            value={angle}
            onChangeText={setAngle}
            keyboardType="number-pad"
            maxLength={3}
            error={
              valid ? undefined : "Ingresá un número entero entre 0 y 360."
            }
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Button
              title="Aplicar giro"
              icon="rotate"
              variant="secondary"
              disabled={!valid || Number(angle) % 360 === item.rotation}
              onPress={() => onChange({ rotation: Number(angle) % 360 })}
            />
            <Button
              title="Enderezar"
              variant="quiet"
              disabled={item.rotation === 0}
              onPress={() => onChange({ rotation: 0 })}
            />
          </View>
        </View>
      )}
      {item.type === "table" && (
        <View style={{ flexDirection: "row", gap: 12 }}>
          {(["width", "height"] as const).map((dimension) => {
            const label = dimension === "width" ? "Ancho" : "Fondo";
            const value = item[dimension] ?? TABLE_SIZE[dimension];
            return (
              <View key={dimension} style={{ flex: 1, gap: 6 }}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {label}
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {[-1, 1].map((direction) => (
                    <Button
                      key={direction}
                      title={direction < 0 ? "−" : "+"}
                      accessibilityLabel={`${direction < 0 ? "Reducir" : "Aumentar"} ${label.toLowerCase()} de la mesa`}
                      variant="secondary"
                      style={{ flex: 1, minWidth: 0 }}
                      disabled={
                        direction < 0
                          ? value <= TABLE_LIMITS[dimension].min
                          : value >= TABLE_LIMITS[dimension].max
                      }
                      onPress={() =>
                        onChange({
                          [dimension]: adjustedTableSize(
                            item,
                            dimension,
                            direction * (dimension === "width" ? 2 : 1),
                          ),
                        })
                      }
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
