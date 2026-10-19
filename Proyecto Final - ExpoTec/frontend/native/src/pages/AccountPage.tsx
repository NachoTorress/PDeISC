import { useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import {
  Button,
  Card,
  CheckRow,
  Field,
  Heading,
  Screen,
} from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { AuthError } from "../lib/authTypes";
import type { AccountRole, Credentials } from "../lib/authTypes";
import { validateCredentials } from "../lib/authValidation";
import { formatDate } from "../lib/format";

const roleNames: Record<AccountRole, string> = {
  student: "Alumno",
  teacher: "Profesor",
  loans: "Encargado de préstamos",
  admin: "Administrador",
};
const empty: Credentials = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
};

export default function AccountPage({
  onDemo,
  onSpaces,
}: {
  onDemo: () => void;
  onSpaces: () => void;
}) {
  const { colors } = useTheme();
  const { user, ready, error: sessionError, client, retry } = useAuth();
  const [register, setRegister] = useState(false);
  const [input, setInput] = useState<Credentials>(empty);
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const working = useRef(false);
  const validation = validateCredentials(input, register);
  if (register && confirmation !== input.password)
    validation.confirmation = "Las contraseñas deben coincidir.";
  const fieldError = (key: string) =>
    serverFields[key] || (touched[key] ? validation[key] : undefined);
  function update(key: keyof Credentials, value: string) {
    setInput((current) => ({ ...current, [key]: value }));
    setTouched((current) => ({ ...current, [key]: true }));
    setServerFields((current) => ({ ...current, [key]: "" }));
    setError("");
    setMessage("");
  }
  async function run(action: () => Promise<void>, success: string) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(success);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos completar la operación.",
      );
      if (cause instanceof AuthError) setServerFields(cause.fields);
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  function submit() {
    setTouched({
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      confirmation: true,
    });
    if (Object.keys(validation).length) return;
    const credentials: Credentials = {
      email: input.email.trim().toLowerCase(),
      password: input.password,
    };
    if (register)
      Object.assign(credentials, {
        firstName: input.firstName?.trim().normalize("NFC"),
        lastName: input.lastName?.trim().normalize("NFC"),
      });
    void run(
      async () => {
        await client.signIn(credentials, register);
        setInput(empty);
        setConfirmation("");
        setTouched({});
        setShowPassword(false);
      },
      register ? "Tu cuenta de alumno está creada." : "Iniciaste sesión.",
    );
  }
  const paragraph = { color: colors.muted, fontSize: 15, lineHeight: 22 };
  return (
    <Screen>
      <View
        style={{ width: "100%", maxWidth: 560, alignSelf: "center", gap: 18 }}
      >
        <Heading title="Mi cuenta" subtitle="Tu acceso a ExpoTec" />
        {!!(error || sessionError) && (
          <Text
            accessibilityRole="alert"
            style={{ ...paragraph, color: colors.error }}
          >
            {error || sessionError}
          </Text>
        )}
        {!!message && (
          <Text
            accessibilityLiveRegion="polite"
            style={{ ...paragraph, color: colors.success }}
          >
            {message}
          </Text>
        )}
        {!ready ? (
          <Card>
            <ActivityIndicator color={colors.primary} />
            <Text style={paragraph}>Recuperando tu sesión…</Text>
          </Card>
        ) : user ? (
          <Card>
            <Heading title={`${user.firstName} ${user.lastName}`} />
            <Text selectable style={{ color: colors.text, fontSize: 16 }}>
              {user.email}
            </Text>
            <Text style={paragraph}>
              Permisos:{" "}
              {user.roles.map((role) => roleNames[role]).join(", ") ||
                "Sin permisos asignados"}
            </Text>
            <Text style={paragraph}>
              Cuenta creada el {formatDate(user.createdAt)}
            </Text>
            <Text style={paragraph}>
              Tu cuenta y los espacios compartidos se guardan en el servidor.
              Los proyectos, el inventario y los préstamos de la demostración
              siguen siendo ejemplos locales.
            </Text>
            <Button
              title={busy ? "Verificando…" : "Actualizar sesión"}
              variant="secondary"
              disabled={busy}
              onPress={() => {
                void run(async () => {
                  if (!(await client.verify()))
                    throw new AuthError(
                      "Tu sesión venció. Volvé a ingresar.",
                      401,
                    );
                }, "Sesión y permisos actualizados.");
              }}
            />
            {confirmLogout ? (
              <Card>
                <Text style={paragraph}>
                  ¿Querés cerrar la sesión de esta cuenta en este dispositivo?
                </Text>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  <Button
                    title={busy ? "Cerrando…" : "Sí, cerrar sesión"}
                    variant="danger"
                    disabled={busy}
                    onPress={() => {
                      void run(async () => {
                        await client.signOut();
                        setConfirmLogout(false);
                      }, "Cerraste sesión.");
                    }}
                  />
                  <Button
                    title="Cancelar"
                    variant="quiet"
                    disabled={busy}
                    onPress={() => setConfirmLogout(false)}
                  />
                </View>
              </Card>
            ) : (
              <Button
                title="Cerrar sesión"
                variant="quiet"
                disabled={busy}
                onPress={() => setConfirmLogout(true)}
              />
            )}
          </Card>
        ) : sessionError ? (
          <Card>
            <Text style={paragraph}>
              La sesión guardada se conserva para que puedas volver a intentar
              la conexión.
            </Text>
            <Button
              title="Reintentar conexión"
              onPress={() => {
                void retry();
              }}
            />
          </Card>
        ) : (
          <Card>
            <Heading
              title={register ? "Crear cuenta" : "Iniciar sesión"}
              subtitle={
                register
                  ? "Registrate como alumno. La escuela asigna los demás permisos."
                  : "Ingresá con tu correo y contraseña."
              }
            />
            {register && (
              <>
                <Field
                  label="Nombre"
                  value={input.firstName ?? ""}
                  onChangeText={(value) => update("firstName", value)}
                  error={fieldError("firstName")}
                  maxLength={80}
                  autoComplete="given-name"
                  editable={!busy}
                />
                <Field
                  label="Apellido"
                  value={input.lastName ?? ""}
                  onChangeText={(value) => update("lastName", value)}
                  error={fieldError("lastName")}
                  maxLength={80}
                  autoComplete="family-name"
                  editable={!busy}
                />
              </>
            )}
            <Field
              label="Correo electrónico"
              value={input.email}
              onChangeText={(value) => update("email", value)}
              error={fieldError("email")}
              keyboardType="email-address"
              autoComplete="email"
              maxLength={254}
              editable={!busy}
            />
            <Field
              label="Contraseña"
              value={input.password}
              onChangeText={(value) => update("password", value)}
              error={fieldError("password")}
              hint={register ? "Entre 12 y 128 caracteres." : undefined}
              secureTextEntry={!showPassword}
              autoComplete={register ? "new-password" : "current-password"}
              maxLength={128}
              editable={!busy}
              onSubmitEditing={register ? undefined : submit}
            />
            {register && (
              <Field
                label="Repetir contraseña"
                value={confirmation}
                onChangeText={(value) => {
                  setConfirmation(value);
                  setTouched((current) => ({ ...current, confirmation: true }));
                }}
                error={fieldError("confirmation")}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                maxLength={128}
                editable={!busy}
                onSubmitEditing={submit}
              />
            )}
            <CheckRow
              label="Mostrar contraseña"
              checked={showPassword}
              onChange={setShowPassword}
            />
            <Button
              title={
                busy
                  ? register
                    ? "Creando cuenta…"
                    : "Ingresando…"
                  : register
                    ? "Crear cuenta"
                    : "Ingresar"
              }
              disabled={busy}
              onPress={submit}
              style={{ alignSelf: "stretch" }}
            />
            <Button
              title={
                register ? "Ya tengo una cuenta" : "Crear una cuenta de alumno"
              }
              variant="quiet"
              disabled={busy}
              onPress={() => {
                setRegister(!register);
                setInput(empty);
                setConfirmation("");
                setTouched({});
                setServerFields({});
                setError("");
                setMessage("");
                setShowPassword(false);
              }}
            />
          </Card>
        )}
        <Button
          title="Ver espacios compartidos"
          icon="map"
          onPress={onSpaces}
        />
        <Button
          title="Volver a la demostración"
          icon="arrowLeft"
          variant="secondary"
          onPress={onDemo}
        />
      </View>
    </Screen>
  );
}
