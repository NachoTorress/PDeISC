/**
 * Campos extra del registro: tipo de cuenta (alumno o invitado), nombre y
 * apellido. Nombre y apellido aceptan solo letras, espacios y apóstrofes; el
 * error se muestra mientras se escribe.
 */
import { Choice, Field } from "../ui";
import type { Credentials } from "../../lib/authTypes";

export function RegisterFields({
  accountType,
  input,
  busy,
  fieldError,
  onAccountType,
  onChange,
}: {
  accountType: "student" | "guest";
  input: Credentials;
  busy: boolean;
  fieldError: (key: string) => string | undefined;
  onAccountType: (value: "student" | "guest") => void;
  onChange: (key: keyof Credentials, value: string) => void;
}) {
  return (
    <>
      <Choice
        label="Tipo de cuenta"
        value={accountType}
        options={[
          { value: "student", label: "Alumno" },
          { value: "guest", label: "Invitado" },
        ]}
        disabled={busy}
        onChange={(value) => onAccountType(value as "student" | "guest")}
      />
      <Field
        label="Nombre"
        value={input.firstName ?? ""}
        onChangeText={(value) => onChange("firstName", value)}
        error={fieldError("firstName")}
        maxLength={80}
        autoComplete="given-name"
        editable={!busy}
      />
      <Field
        label="Apellido"
        value={input.lastName ?? ""}
        onChangeText={(value) => onChange("lastName", value)}
        error={fieldError("lastName")}
        maxLength={80}
        autoComplete="family-name"
        editable={!busy}
      />
    </>
  );
}
