import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import {
  maximumProjectSubjects,
  projectSubjectInputError,
  projectSubjectKey,
  suggestedProjectSubjects,
} from "../lib/projectSubjects";
import { Button, Card, Field, Heading, InlineConfirm } from "./ui";

export default function ProjectSubjectsPicker({
  value,
  onChange,
  disabled = false,
  error,
  onPendingChange,
}: {
  value: string[];
  onChange: (subjects: string[]) => void;
  disabled?: boolean;
  error?: string;
  onPendingChange?: (pending: boolean) => void;
}) {
  const { colors } = useTheme();
  const [input, setInput] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [remove, setRemove] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const pendingCallback = useRef(onPendingChange);
  pendingCallback.current = onPendingChange;
  useEffect(() => {
    pendingCallback.current?.(Boolean(input.trim()));
  }, [input]);
  useEffect(() => () => pendingCallback.current?.(false), []);
  const full = value.length >= maximumProjectSubjects;
  const duplicate =
    input.trim() &&
    value.some(
      (subject) => projectSubjectKey(subject) === projectSubjectKey(input),
    );
  const inputError =
    attempted || duplicate ? projectSubjectInputError(input, value) : "";
  const suggestions = suggestedProjectSubjects(value, input);

  function add(candidate: string) {
    if (disabled) return;
    setAttempted(true);
    if (projectSubjectInputError(candidate, value)) return;
    const subject = candidate.trim();
    onChange([...value, subject]);
    setInput("");
    setAttempted(false);
    setNotice(`Se agregó ${subject}.`);
  }

  function clearInput() {
    setInput("");
    setAttempted(false);
    setNotice("");
  }

  return (
    <Card testID="project-subjects-picker">
      <Heading
        title="Materias del proyecto"
        subtitle="Elegí al menos una materia vinculada con lo que van a presentar."
      />
      <Text
        accessibilityLiveRegion="polite"
        style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}
      >
        {value.length} de {maximumProjectSubjects} materias agregadas
      </Text>
      {value.length ? (
        <View
          testID="selected-project-subjects"
          style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
        >
          {value.map((subject) => (
            <Button
              key={projectSubjectKey(subject)}
              title={subject}
              endIcon="close"
              accessibilityLabel={`Quitar materia ${subject}`}
              variant="secondary"
              disabled={disabled}
              style={{ minWidth: 0, paddingHorizontal: 10 }}
              onPress={() => setRemove(subject)}
            />
          ))}
        </View>
      ) : (
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
          Todavía no agregaste materias. Tocá una sugerencia o escribí otra
          abajo.
        </Text>
      )}
      {!disabled && remove !== null && (
        <InlineConfirm
          text={`¿Quitar ${remove} de este proyecto?`}
          confirmLabel="Quitar materia"
          onCancel={() => setRemove(null)}
          onConfirm={() => {
            onChange(value.filter((subject) => subject !== remove));
            setNotice(`Se quitó ${remove}.`);
            setRemove(null);
          }}
        />
      )}
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ color: colors.error, fontSize: 13, lineHeight: 19 }}
        >
          {error}
        </Text>
      )}
      {full ? (
        <>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
            Llegaste al máximo de 10 materias. Quitá una si querés elegir otra.
          </Text>
          {!!input.trim() && (
            <Button
              title="Limpiar texto sin agregar"
              variant="quiet"
              disabled={disabled}
              onPress={clearInput}
            />
          )}
        </>
      ) : (
        <>
          <Field
            label="Agregar una materia"
            placeholder="Por ejemplo, Programación"
            value={input}
            maxLength={80}
            editable={!disabled}
            error={inputError}
            hint={
              input.trim()
                ? "Esta materia todavía no está agregada. Tocá Agregar o pulsá Enter."
                : "Escribí el nombre y tocá Agregar o pulsá Enter."
            }
            onChangeText={(next) => {
              setInput(next);
              setAttempted(false);
              setNotice("");
            }}
            onSubmitEditing={() => add(input)}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Button
              title="Agregar materia"
              icon="plus"
              variant="secondary"
              disabled={disabled || !input.trim()}
              onPress={() => add(input)}
            />
            {!!input.trim() && (
              <Button
                title="Limpiar texto"
                variant="quiet"
                disabled={disabled}
                onPress={clearInput}
              />
            )}
          </View>
          {!!suggestions.length && (
            <View style={{ gap: 8 }}>
              <Text
                style={{ color: colors.muted, fontSize: 13, fontWeight: "600" }}
              >
                {input.trim()
                  ? "Sugerencias que coinciden"
                  : "Sugerencias para empezar"}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {suggestions.map((subject) => (
                  <Button
                    key={subject}
                    title={subject}
                    icon="plus"
                    accessibilityLabel={`Agregar materia ${subject}`}
                    variant="quiet"
                    disabled={disabled}
                    style={{
                      minWidth: 0,
                      paddingHorizontal: 10,
                      backgroundColor: colors.surfaceVariant,
                    }}
                    onPress={() => add(subject)}
                  />
                ))}
              </View>
            </View>
          )}
        </>
      )}
      {!!notice && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}
        >
          {notice}
        </Text>
      )}
    </Card>
  );
}
