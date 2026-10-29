/**
 * Tarjeta de un préstamo: estado (en préstamo, parcial o devuelto), proyecto,
 * elemento y jornada, unidades entregadas y devueltas, quién entregó y quién
 * retiró, y las acciones de devolver, registrar novedad y ver movimientos.
 */
import type { ReactNode } from "react";
import { Text } from "react-native";
import { ActionRow, Button, Card, Chip, Heading } from "../ui";
import { useTheme } from "../../contexts/ThemeContext";
import { formatMoment } from "../../lib/format";
import type { LoanSummary } from "../../lib/sharedLoans";

export function LoanCard({
  loan,
  locked,
  onReturn,
  onNote,
  onHistory,
  children,
}: {
  loan: LoanSummary;
  /** true mientras se guarda algo o hay un formulario abierto. */
  locked: boolean;
  onReturn: () => void;
  onNote: () => void;
  onHistory: () => void;
  /** Contenido extra al pie (por ejemplo, los movimientos abiertos). */
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  const paragraph = { color: colors.muted, lineHeight: 22 };
  const remaining = loan.quantity - loan.returned;
  return (
    <Card key={loan.id} style={{ flex: 1 }}>
      <Chip
        label={
          remaining === 0
            ? "Devuelto"
            : loan.returned
              ? "Devolución parcial"
              : "En préstamo"
        }
        tone={remaining === 0 ? "success" : "warning"}
      />
      <Heading
        title={loan.projectName}
        subtitle={`${loan.resourceName} · Jornada ${loan.day}`}
      />
      <Text style={{ color: colors.text, lineHeight: 24 }}>
        Entregadas: {loan.quantity} · Devueltas: {loan.returned} · Sin devolver:{" "}
        {remaining}
      </Text>
      <Text style={paragraph}>
        Entrega: {formatMoment(loan.createdAt)} · {loan.deliveredFirstName}{" "}
        {loan.deliveredLastName}
      </Text>
      <Text style={paragraph}>
        Retiró: {loan.recipientFirstName} {loan.recipientLastName}
      </Text>
      {!!loan.note && (
        <Text style={paragraph}>Observación de entrega: {loan.note}</Text>
      )}
      <ActionRow footer>
        {remaining > 0 && (
          <Button
            title="Devolver"
            accessibilityLabel={`Devolver ${loan.resourceName} de ${loan.projectName}`}
            icon="check"
            disabled={locked}
            onPress={onReturn}
          />
        )}
        <Button
          title="Registrar novedad"
          accessibilityLabel={`Registrar novedad de ${loan.resourceName} de ${loan.projectName}`}
          variant="secondary"
          disabled={locked}
          onPress={onNote}
        />
        <Button
          title="Ver movimientos"
          accessibilityLabel={`Ver movimientos de ${loan.resourceName} de ${loan.projectName}`}
          variant="quiet"
          disabled={locked}
          onPress={onHistory}
        />
      </ActionRow>
      {children}
    </Card>
  );
}
