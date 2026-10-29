/** Referencias de color del plano, siempre acompañadas de texto. */
import { Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { styles } from "./styles";

export function FloorplanLegend({
  shared,
  showPending,
}: {
  shared: boolean;
  showPending: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.legend}>
      {(shared
        ? [
            {
              label: "Disponible",
              color: colors.table,
            },
            { label: "Confirmado", color: colors.tableOccupied },
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
  );
}
