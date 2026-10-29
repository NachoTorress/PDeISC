/**
 * Formulario para completar un acceso social: alta de cuenta nueva (tipo,
 * nombre, apellido y contraseña propia con confirmación) o vinculación de una
 * cuenta existente (contraseña actual). Los errores se muestran por campo
 * mientras se escribe.
 */
import { Text } from "react-native";
import { Button, Choice, Field } from "../ui";
import { useTheme } from "../../contexts/ThemeContext";
import { providerNames } from "./types";
import type { SocialInput, SocialStatus } from "./types";

export function SocialCompleteForm({
  status,
  input,
  fields,
  accountType,
  busy,
  onAccountType,
  onChange,
  onSubmit,
}: {
  /** Estado del acceso: debe ser "signup" o "link". */
  status: SocialStatus;
  input: SocialInput;
  /** Mensajes de error por campo. */
  fields: Record<string, string>;
  accountType: "student" | "guest";
  busy: boolean;
  onAccountType: (value: "student" | "guest") => void;
  onChange: (key: keyof SocialInput, value: string) => void;
  onSubmit: () => void;
}) {
  const { colors } = useTheme();
  const text = { color: colors.muted, fontSize: 15, lineHeight: 22 };
  return (
    <>
      <Text selectable style={text}>
        {providerNames[status.provider]} · {status.email}
      </Text>
      <Text style={text}>
        {status.mode === "signup"
          ? "Creá también una contraseña propia de ExpoTec. Después podrás ingresar con este proveedor o con tu correo y contraseña."
          : `Tu cuenta de ExpoTec ya existe. Confirmá tu contraseña actual para vincular ${providerNames[status.provider]}. Conservás tu contraseña y tus permisos. En los próximos accesos con ${providerNames[status.provider]} no te la pediremos.`}
      </Text>
      {status.mode === "signup" && (
        <>
          <Choice
            label="Tipo de cuenta"
            value={accountType}
            options={[
              { value: "guest", label: "Invitado" },
              { value: "student", label: "Alumno" },
            ]}
            onChange={(value) => onAccountType(value as "student" | "guest")}
            disabled={busy}
          />
          <Field
            label="Nombre"
            value={input.firstName}
            onChangeText={(value) => onChange("firstName", value)}
            error={fields.firstName}
            maxLength={80}
            editable={!busy}
            autoComplete="given-name"
          />
          <Field
            label="Apellido"
            value={input.lastName}
            onChangeText={(value) => onChange("lastName", value)}
            error={fields.lastName}
            maxLength={80}
            editable={!busy}
            autoComplete="family-name"
          />
        </>
      )}
      <Field
        label={
          status.mode === "signup"
            ? "Crear contraseña de ExpoTec"
            : "Tu contraseña actual de ExpoTec"
        }
        value={input.password}
        onChangeText={(value) => onChange("password", value)}
        error={fields.password}
        hint={
          status.mode === "signup"
            ? "Entre 12 y 128 caracteres."
            : "La que ya usás para entrar a ExpoTec, no la de Google u otro proveedor."
        }
        secureTextEntry
        maxLength={128}
        editable={!busy}
        autoComplete={
          status.mode === "signup" ? "new-password" : "current-password"
        }
      />
      {status.mode === "signup" && (
        <Field
          label="Repetir contraseña de ExpoTec"
          value={input.confirmation}
          onChangeText={(value) => onChange("confirmation", value)}
          error={fields.confirmation}
          secureTextEntry
          maxLength={128}
          editable={!busy}
          autoComplete="new-password"
        />
      )}
      <Button
        title={
          busy
            ? "Completando…"
            : status.mode === "signup"
              ? "Crear cuenta e ingresar"
              : "Vincular e ingresar"
        }
        onPress={onSubmit}
        disabled={busy}
      />
    </>
  );
}
