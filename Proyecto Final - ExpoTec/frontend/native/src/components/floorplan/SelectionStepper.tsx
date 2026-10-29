/**
 * Controles para elegir la pieza anterior o siguiente del plano en pantallas
 * angostas, donde tocar piezas chicas con el dedo es difícil. Es la
 * alternativa accesible a seleccionar tocando el plano.
 */
import { Text, View } from "react-native";
import type { Furniture } from "../../lib/types";
import { useTheme } from "../../contexts/ThemeContext";
import { Button } from "../ui";

/** Nombre visible de cada tipo de pieza. */
const typeNames = {
  table: "Mesa",
  bench: "Banco",
  power: "Toma",
  label: "Zona",
};

export function SelectionStepper({
  furniture,
  selectedId,
  onSelect,
}: {
  furniture: Furniture[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { colors } = useTheme();
  const selectedIndex = furniture.findIndex((item) => item.id === selectedId);
  const selectedFurniture =
    selectedIndex >= 0 ? furniture[selectedIndex] : undefined;
  /** Selecciona la pieza anterior (-1) o siguiente (1), en forma circular. */
  function selectNearby(direction: number) {
    const count = furniture.length;
    if (!count) return;
    const index =
      selectedIndex < 0
        ? direction > 0
          ? 0
          : count - 1
        : (selectedIndex + direction + count) % count;
    onSelect(furniture[index].id);
  }
  return (
    <View
      testID="furniture-selection-controls"
      style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
    >
      <Button
        title=""
        icon="arrowLeft"
        accessibilityLabel="Seleccionar pieza anterior"
        variant="secondary"
        style={{ width: 44, minWidth: 0, paddingHorizontal: 6, gap: 0 }}
        disabled={!furniture.length}
        onPress={() => selectNearby(-1)}
      />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text
          numberOfLines={1}
          accessibilityLiveRegion="polite"
          style={{ color: colors.text, fontWeight: "600", fontSize: 13 }}
        >
          {selectedFurniture
            ? `${typeNames[selectedFurniture.type]} · ${selectedIndex + 1} de ${furniture.length}`
            : furniture.length
              ? "Elegí una pieza"
              : "El plano está vacío"}
        </Text>
        {!!furniture.length && (
          <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 11 }}>
            {selectedFurniture?.id ?? "Usá las flechas o tocá el plano."}
          </Text>
        )}
      </View>
      <Button
        title=""
        icon="arrowRight"
        accessibilityLabel="Seleccionar pieza siguiente"
        variant="secondary"
        style={{ width: 44, minWidth: 0, paddingHorizontal: 6, gap: 0 }}
        disabled={!furniture.length}
        onPress={() => selectNearby(1)}
      />
    </View>
  );
}
