/** Devoluciones y novedades de un préstamo, con fecha, hora y responsable. */
import { Text, View } from "react-native";
import { Button, Heading } from "../ui";
import { useTheme } from "../../contexts/ThemeContext";
import { formatMoment } from "../../lib/format";
import type { SharedLoan } from "../../lib/sharedLoans";

export function LoanHistory({
  loan,
  onClose,
}: {
  /** Préstamo consultado con sus devoluciones (`returns`). */
  loan: SharedLoan;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const paragraph = { color: colors.muted, lineHeight: 22 };
  return (
    <View style={{ gap: 12 }}>
      <Heading title="Devoluciones y novedades" />
      {!loan.returns.length && (
        <Text style={paragraph}>
          Todavía no hay devoluciones ni novedades registradas.
        </Text>
      )}
      {loan.returns.map((entry) => (
        <View key={entry.id} style={{ gap: 4 }}>
          <Text style={{ color: colors.text, fontWeight: "600" }}>
            {entry.quantity
              ? `Devolución: ${entry.quantity} · Dañadas: ${entry.damagedQuantity}`
              : "Novedad sin devolución"}
          </Text>
          <Text style={paragraph}>
            {formatMoment(entry.createdAt)} · {entry.firstName} {entry.lastName}
          </Text>
          {!!entry.note && <Text style={paragraph}>{entry.note}</Text>}
        </View>
      ))}
      <Text style={paragraph}>
        Se muestran los últimos 100 movimientos; el historial se conserva en el
        servidor.
      </Text>
      <Button title="Cerrar movimientos" variant="quiet" onPress={onClose} />
    </View>
  );
}
