/** Lista de datos a corregir en el paso actual, con el nombre visible de cada campo. */
import { Text } from "react-native";
import { Card } from "../ui";
import { useTheme } from "../../contexts/ThemeContext";
import { proposalFieldLabels } from "../../lib/proposalSteps";

export function ProposalStepErrors({
  issues,
}: {
  /** Pares [campo, mensaje] del paso actual. */
  issues: [string, string][];
}) {
  const { colors } = useTheme();
  const paragraph = { color: colors.muted, fontSize: 14, lineHeight: 21 };
  return (
    <Card testID="proposal-step-errors" style={{ borderColor: colors.error }}>
      <Text
        accessibilityRole="alert"
        style={{ color: colors.error, fontWeight: "600" }}
      >
        Revisá estos datos para continuar:
      </Text>
      {issues.map(([field, message]) => (
        <Text key={field} style={{ ...paragraph, color: colors.error }}>
          {proposalFieldLabels[field] ?? "Propuesta"}: {message}
        </Text>
      ))}
    </Card>
  );
}
