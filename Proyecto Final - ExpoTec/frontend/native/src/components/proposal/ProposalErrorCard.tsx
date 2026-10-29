/**
 * Aviso de error de la propuesta. Si la carga falló ofrece reintentar; si otra
 * persona cambió el proyecto o tomó el puesto (409) explica que el borrador
 * se conserva y permite revisar el puesto o recargar la versión guardada,
 * con confirmación dentro de la tarjeta.
 */
import { useState } from "react";
import { Text } from "react-native";
import { Button, Card, InlineConfirm } from "../ui";
import { useTheme } from "../../contexts/ThemeContext";

export function ProposalErrorCard({
  error,
  hasDraft,
  conflict,
  editing,
  onRetry,
  onReviewPlace,
  onReload,
}: {
  error: string;
  /** false si todavía no se pudo cargar el borrador. */
  hasDraft: boolean;
  /** true si el servidor respondió 409 (cambio simultáneo). */
  conflict: boolean;
  /** true al editar una propuesta ya guardada. */
  editing: boolean;
  onRetry: () => void;
  onReviewPlace: () => void;
  /** Descarta el borrador y vuelve a cargar la propuesta guardada. */
  onReload: () => void;
}) {
  const { colors } = useTheme();
  const [reloadConfirm, setReloadConfirm] = useState(false);
  const paragraph = { color: colors.muted, fontSize: 14, lineHeight: 21 };
  return (
    <Card>
      <Text
        accessibilityRole="alert"
        style={{ ...paragraph, color: colors.error }}
      >
        {error}
      </Text>
      {!hasDraft && (
        <Button
          title="Reintentar carga"
          variant="secondary"
          onPress={onRetry}
        />
      )}
      {conflict && (
        <>
          <Text style={paragraph}>
            Tu borrador se conserva. Podés revisar los datos y actualizar los
            puestos antes de volver a enviar.
          </Text>
          <Button
            title="Revisar puesto y elementos"
            variant="secondary"
            onPress={onReviewPlace}
          />
          {editing && (
            <Button
              title="Recargar propuesta guardada"
              variant="quiet"
              onPress={() => setReloadConfirm(true)}
            />
          )}
        </>
      )}
      {reloadConfirm && (
        <InlineConfirm
          text="¿Descartar estos cambios y cargar la última propuesta guardada?"
          confirmLabel="Descartar y recargar"
          onCancel={() => setReloadConfirm(false)}
          onConfirm={() => {
            setReloadConfirm(false);
            onReload();
          }}
        />
      )}
    </Card>
  );
}
