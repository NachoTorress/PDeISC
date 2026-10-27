/** Búsqueda de alumnos y profesores por correo exacto para sumarlos a una propuesta. */
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Button, Card, Field } from "./ui";
import ProjectPeopleList from "./ProjectPeopleList";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { AuthError } from "../lib/authTypes";
import type { ProjectParticipant } from "../lib/sharedProjects";
import {
  projectPeopleEmail,
  projectPeopleEmailError,
  projectPeopleLimit,
  projectPersonAdditionError,
} from "../lib/projectPeople";
import type { ProjectPeopleRole } from "../lib/projectPeople";

/** Busca con `GET /api/projects/people` y agrega la persona confirmada. */
export default function SharedPeoplePicker({
  role,
  people,
  protectedIds = [],
  excludedIds = [],
  disabled,
  error,
  onChange,
  onPendingChange,
}: {
  role: ProjectPeopleRole;
  people: ProjectParticipant[];
  protectedIds?: string[];
  excludedIds?: string[];
  disabled: boolean;
  error?: string;
  onChange: (people: ProjectParticipant[]) => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const { client, user } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [notice, setNotice] = useState("");
  const [candidate, setCandidate] = useState<{
    person: ProjectParticipant;
    email: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const working = useRef<number | null>(null);
  const active = useRef(true);
  const requestId = useRef(0);
  const current = useRef({ people, excludedIds, disabled });
  current.current = { people, excludedIds, disabled };
  const pendingCallback = useRef(onPendingChange);
  pendingCallback.current = onPendingChange;
  const pending = !!email.trim() || !!candidate;
  const limit = projectPeopleLimit[role];
  const noun = role === "student" ? "alumno" : "profesor";
  const atLimit = people.length >= limit;
  useEffect(() => {
    pendingCallback.current?.(pending);
  }, [pending]);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      requestId.current++;
      pendingCallback.current?.(false);
    };
  }, []);
  /** Motivo por el que no se puede agregar una persona. */
  function additionError(personId: string) {
    return projectPersonAdditionError({
      role,
      personId,
      selectedIds: current.current.people.map((person) => person.id),
      excludedIds: current.current.excludedIds,
    });
  }
  /** Limpia la búsqueda y su resultado. */
  function clearSearch() {
    requestId.current++;
    working.current = null;
    setBusy(false);
    setEmail("");
    setCandidate(null);
    setLookupError("");
    setNotice("");
  }
  /** Consulta la cuenta por correo; descarta respuestas viejas. */
  async function search() {
    if (working.current !== null || disabled || atLimit) return;
    if (candidate?.email === projectPeopleEmail(email)) return;
    setNotice("");
    setCandidate(null);
    const validation = projectPeopleEmailError(email);
    setLookupError(validation);
    if (validation) return;
    const id = ++requestId.current;
    working.current = id;
    setBusy(true);
    const searchedEmail = projectPeopleEmail(email);
    try {
      const { person } = await client.send<{ person: ProjectParticipant }>(
        "/api/projects/people",
        { email: searchedEmail, role },
        "GET",
      );
      if (
        !active.current ||
        id !== requestId.current ||
        current.current.disabled
      )
        return;
      const conflict = additionError(person.id);
      if (conflict) setLookupError(conflict);
      else setCandidate({ person, email: searchedEmail });
    } catch (cause) {
      if (!active.current || id !== requestId.current) return;
      setLookupError(
        cause instanceof AuthError && cause.status === 404
          ? `No encontramos un ${noun} con ese correo. Revisá la dirección y que su cuenta tenga el permiso de ${role === "student" ? "alumno" : "profesor"}.`
          : cause instanceof Error
            ? cause.message
            : "No pudimos buscar la cuenta. Revisá la conexión y volvé a intentarlo.",
      );
    } finally {
      if (working.current === id) {
        working.current = null;
        if (active.current) setBusy(false);
      }
    }
  }
  /** Agrega la persona encontrada. */
  function addCandidate() {
    if (!candidate || disabled || busy) return;
    const conflict = additionError(candidate.person.id);
    if (conflict) {
      setLookupError(conflict);
      setCandidate(null);
      return;
    }
    onChange([...current.current.people, candidate.person]);
    setNotice(
      `${candidate.person.firstName} ${candidate.person.lastName} ${role === "student" ? "se agregó al equipo" : "se agregó como profesor responsable"}.`,
    );
    setCandidate(null);
    setEmail("");
    setLookupError("");
  }
  return (
    <Card testID={`project-people-${role}`}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
        <Text
          accessibilityRole="header"
          style={{
            color: colors.text,
            fontSize: 19,
            fontWeight: "600",
            flex: 1,
          }}
        >
          {role === "student"
            ? "Alumnos del equipo"
            : "Profesores responsables"}
        </Text>
        <Text
          accessibilityLabel={`${people.length} de ${limit} ${role === "student" ? "alumnos" : "profesores"}`}
          style={{ color: colors.muted, fontSize: 13, paddingTop: 3 }}
        >
          {people.length}/{limit}
        </Text>
      </View>
      <Text style={{ color: colors.muted, lineHeight: 21, fontSize: 14 }}>
        {role === "student"
          ? "Vos ya estás incluido. Sumá a tus compañeros buscando la cuenta con la que ingresan a ExpoTec."
          : "Agregá al menos un profesor que vaya a revisar la propuesta. Su cuenta debe estar habilitada como profesor."}
      </Text>
      <ProjectPeopleList
        role={role}
        people={people}
        protectedIds={protectedIds}
        actorId={user?.id}
        disabled={disabled || busy}
        onRemove={(id) =>
          onChange(current.current.people.filter((person) => person.id !== id))
        }
      />
      {!people.length && (
        <Text style={{ color: colors.muted, fontSize: 14 }}>
          Todavía no agregaste {role === "student" ? "alumnos" : "profesores"}.
        </Text>
      )}
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ color: colors.error, fontSize: 13 }}
        >
          {error}
        </Text>
      )}
      {!!notice && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: colors.success, fontSize: 13 }}
        >
          {notice}
        </Text>
      )}
      {atLimit ? (
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.muted, lineHeight: 20, fontSize: 13 }}>
            {role === "student"
              ? "Completaste el máximo de 12 alumnos, incluyéndote."
              : "Completaste el máximo de 5 profesores responsables."}{" "}
            Para cambiar a alguien, quitá primero una cuenta.
          </Text>
          {pending && (
            <Button
              title="Limpiar correo"
              variant="quiet"
              disabled={disabled}
              onPress={clearSearch}
            />
          )}
        </View>
      ) : (
        <View
          style={{
            borderTopWidth: 1,
            borderColor: colors.outline,
            paddingTop: 12,
            gap: 10,
          }}
        >
          <Field
            label={`Correo del ${noun}`}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setCandidate(null);
              setLookupError("");
              setNotice("");
            }}
            keyboardType="email-address"
            placeholder="nombre@ejemplo.com"
            autoComplete="off"
            editable={!disabled && !busy}
            maxLength={254}
            error={lookupError}
            hint="Usá su correo de ExpoTec. Buscar una cuenta todavía no la agrega."
            onSubmitEditing={() => void search()}
          />
          {!candidate && (
            <Button
              title={busy ? "Buscando cuenta…" : `Buscar ${noun}`}
              icon="search"
              variant="secondary"
              disabled={disabled || busy}
              onPress={() => void search()}
            />
          )}
          {busy && (
            <ActivityIndicator
              accessibilityLabel={`Buscando ${noun}`}
              color={colors.primary}
            />
          )}
          {candidate && (
            <View
              testID={`person-search-result-${role}`}
              style={{
                gap: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: colors.primary,
                borderRadius: 8,
                backgroundColor: colors.selectedContainer,
              }}
            >
              <Text
                accessibilityLiveRegion="polite"
                style={{ color: colors.onSelectedContainer, fontSize: 13 }}
              >
                Cuenta encontrada · {noun}
              </Text>
              <Text
                style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}
              >
                {candidate.person.firstName} {candidate.person.lastName}
              </Text>
              <Text
                style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}
              >
                {candidate.email}
              </Text>
              <Button
                title={
                  role === "student"
                    ? "Agregar al equipo"
                    : "Agregar profesor responsable"
                }
                icon="plus"
                disabled={disabled}
                onPress={addCandidate}
              />
            </View>
          )}
          {pending && (
            <Button
              title={busy ? "Cancelar búsqueda" : "Limpiar correo"}
              variant="quiet"
              disabled={disabled}
              onPress={clearSearch}
            />
          )}
          <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
            {role === "student"
              ? "Si no tiene cuenta, pedile que se registre antes."
              : "Si no aparece, confirmá con la organización que su cuenta tenga el permiso de profesor."}{" "}
            Este paso no envía invitaciones por correo.
          </Text>
        </View>
      )}
    </Card>
  );
}
