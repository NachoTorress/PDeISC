/** Historial de revisiones de un proyecto: acción, fecha (DD/MM/AA), autor y nota. */
import { Text, View } from "react-native";
import { Card, Heading } from "../ui";
import { useTheme } from "../../contexts/ThemeContext";
import { formatDate } from "../../lib/format";
import type { SharedProject } from "../../lib/sharedProjects";

/** Nombre visible de cada acción de revisión. */
const actionNames: Record<string, string> = {
  submit: "Presentación",
  resubmit: "Reenvío",
  approve: "Confirmación",
  changes: "Pedido de cambios",
  reopen: "Reapertura",
  cancel: "Cancelación",
};

export function ProjectReviewHistory({
  reviews,
}: {
  reviews: NonNullable<SharedProject["reviews"]>;
}) {
  const { colors } = useTheme();
  const paragraph = { color: colors.muted, fontSize: 15, lineHeight: 23 };
  return (
    <Card>
      <Heading title="Historial de revisiones" />
      {reviews.map((item) => (
        <View key={item.id} style={{ gap: 4 }}>
          <Text style={{ color: colors.text, fontWeight: "600" }}>
            {actionNames[item.action] ?? item.action} ·{" "}
            {formatDate(item.createdAt)}
          </Text>
          <Text style={paragraph}>
            {item.firstName} {item.lastName}
            {item.note ? ` · ${item.note}` : ""}
          </Text>
        </View>
      ))}
    </Card>
  );
}
