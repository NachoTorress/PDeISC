import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { Button, Card, Field, InlineConfirm } from "./ui";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import type { ProjectParticipant } from "../lib/sharedProjects";

export default function SharedPeoplePicker({
  role,
  people,
  protectedIds = [],
  excludedIds = [],
  disabled,
  error,
  onChange,
}: {
  role: "student" | "teacher";
  people: ProjectParticipant[];
  protectedIds?: string[];
  excludedIds?: string[];
  disabled: boolean;
  error?: string;
  onChange: (people: ProjectParticipant[]) => void;
}) {
  const { client } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [busy, setBusy] = useState(false);
  const [remove, setRemove] = useState<string | null>(null);
  const working = useRef(false);
  const noun = role === "student" ? "alumno" : "profesor";
  async function add() {
    if (working.current || disabled) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLookupError("Ingresá el correo exacto de la cuenta.");
      return;
    }
    working.current = true;
    setBusy(true);
    setLookupError("");
    try {
      const { person } = await client.send<{ person: ProjectParticipant }>(
        "/api/projects/people/find",
        { email: email.trim(), role },
      );
      if (people.some((item) => item.id === person.id))
        setLookupError("Esa cuenta ya está incluida.");
      else if (excludedIds.includes(person.id))
        setLookupError(
          "Los profesores responsables y los integrantes deben ser cuentas distintas.",
        );
      else {
        onChange([...people, person]);
        setEmail("");
      }
    } catch (cause) {
      setLookupError(
        cause instanceof Error
          ? cause.message
          : "No pudimos consultar la cuenta.",
      );
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  return (
    <Card>
      <Text
        accessibilityRole="header"
        style={{ color: colors.text, fontSize: 19, fontWeight: "600" }}
      >
        {role === "student"
          ? "Integrantes del equipo"
          : "Profesores responsables"}
      </Text>
      <Text style={{ color: colors.muted, lineHeight: 21 }}>
        Agregá{" "}
        {role === "student"
          ? "compañeros que ya tengan cuenta"
          : "cuentas que la escuela haya habilitado como profesor"}{" "}
        mediante su correo.
      </Text>
      {people.map((person) => (
        <View key={person.id} style={{ gap: 8 }}>
          <Text style={{ color: colors.text, fontSize: 16 }}>
            {person.firstName} {person.lastName}
          </Text>
          {protectedIds.includes(person.id) ? (
            <Text style={{ color: colors.muted }}>
              Permanece incluido en el equipo.
            </Text>
          ) : remove === person.id ? (
            <InlineConfirm
              text={`¿Quitar a ${person.firstName} ${person.lastName} de esta propuesta?`}
              confirmLabel="Quitar participante"
              onCancel={() => setRemove(null)}
              onConfirm={() => {
                onChange(people.filter((item) => item.id !== person.id));
                setRemove(null);
              }}
            />
          ) : (
            <Button
              title={`Quitar a ${person.firstName} ${person.lastName}`}
              variant="quiet"
              disabled={disabled || busy}
              onPress={() => setRemove(person.id)}
            />
          )}
        </View>
      ))}
      <Field
        label={`Correo del ${noun}`}
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setLookupError("");
        }}
        keyboardType="email-address"
        autoComplete="off"
        editable={!disabled && !busy}
        maxLength={254}
        error={lookupError || error}
      />
      <Button
        title={busy ? "Buscando cuenta…" : `Agregar ${noun}`}
        variant="secondary"
        disabled={
          disabled || busy || people.length >= (role === "student" ? 12 : 5)
        }
        onPress={() => {
          void add();
        }}
      />
    </Card>
  );
}
