/**
 * Revisión del profesor asignado en la demostración: confirmar el proyecto o
 * pedir cambios con un comentario validado mientras se escribe (10 a 800
 * caracteres).
 */
import { useState } from "react";
import { Text } from "react-native";
import { Button, Field, Section } from "../ui";
import { useTheme } from "../../contexts/ThemeContext";

/** Mensaje de error del comentario, o "" si es válido. */
function feedbackProblem(feedback: string) {
  const length = feedback.trim().length;
  if (length < 10)
    return "Explicá qué debe cambiar el equipo con al menos 10 caracteres.";
  if (length > 800) return "El comentario puede tener hasta 800 caracteres.";
  return "";
}

export function DemoReviewSection({
  onReview,
  onClearError,
}: {
  /** Registra la revisión; devuelve true si se guardó. */
  onReview: (action: "approve" | "changes", feedback: string) => boolean;
  onClearError: () => void;
}) {
  const { colors } = useTheme();
  const [requestingChanges, setRequestingChanges] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [touched, setTouched] = useState(false);
  const problem = feedbackProblem(feedback);
  /** Envía el pedido de cambios si el comentario es válido. */
  function sendChanges() {
    setTouched(true);
    if (problem) return;
    if (onReview("changes", feedback.trim())) setRequestingChanges(false);
  }
  return (
    <Section title="Revisión del proyecto">
      <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
        Al confirmar, se reserva la mesa y el proyecto aparece en la muestra
        pública.
      </Text>
      {requestingChanges ? (
        <>
          <Field
            label="¿Qué necesita ajustar el equipo?"
            value={feedback}
            multiline
            maxLength={800}
            autoFocus
            onChangeText={(value) => {
              setFeedback(value);
              setTouched(true);
              onClearError();
            }}
            error={touched ? problem : ""}
            hint={`${feedback.length}/800 caracteres. La devolución se muestra a los estudiantes.`}
          />
          <Button
            title="Enviar devolución"
            icon="check"
            style={{ alignSelf: "flex-start" }}
            onPress={sendChanges}
          />
          <Button
            title="Cancelar devolución"
            icon="close"
            variant="secondary"
            style={{ alignSelf: "flex-start" }}
            onPress={() => setRequestingChanges(false)}
          />
        </>
      ) : (
        <>
          <Button
            title="Confirmar proyecto"
            icon="check"
            style={{ alignSelf: "flex-start" }}
            onPress={() => onReview("approve", "")}
          />
          <Button
            title="Pedir cambios"
            icon="edit"
            variant="secondary"
            style={{ alignSelf: "flex-start" }}
            onPress={() => {
              setRequestingChanges(true);
              onClearError();
            }}
          />
        </>
      )}
    </Section>
  );
}
