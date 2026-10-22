import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Button,
  Card,
  CheckRow,
  Choice,
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
import { SocialAccess } from "../components/SocialAccess";
import { socialBridge } from "../lib/socialBridge";
import { passwordReset } from "../lib/passwordReset";
import PasswordRecovery from "../components/PasswordRecovery";

const roleNames: Record<AccountRole, string> = {
  guest: "Invitado",
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

export default function AccountPage() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { user, ready, error: sessionError, client, retry } = useAuth();
  const [register, setRegister] = useState(false);
  const [resetToken, setResetToken] = useState(passwordReset.pending);
  const [recovering, setRecovering] = useState(false);
  const [recoveryEnabled, setRecoveryEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    void client
      .query<{ enabled: boolean }>("/api/auth/recovery/query", {})
      .then((result) => {
        if (active) setRecoveryEnabled(result.enabled);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [client]);
  const [socialPending, setSocialPending] = useState(() =>
    Boolean(socialBridge.pending()),
  );
  const [hasSocialProviders, setHasSocialProviders] = useState(false);
  const [accountType, setAccountType] = useState<"student" | "guest">(
    "student",
  );
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
        accountType,
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
      register
        ? `Tu cuenta de ${accountType === "guest" ? "invitado" : "alumno"} está creada.`
        : "Iniciaste sesión.",
    );
  }
  const paragraph = { color: colors.muted, fontSize: 15, lineHeight: 22 };
  const sideBySide =
    width >= 1100 &&
    ready &&
    !user &&
    !sessionError &&
    !socialPending &&
    hasSocialProviders;
  if (resetToken !== null || recovering)
    return (
      <PasswordRecovery
        token={resetToken}
        initialEmail={input.email}
        onClose={() => {
          passwordReset.clear();
          setResetToken(null);
          setRecovering(false);
          setRegister(false);
          setInput(empty);
          setConfirmation("");
          setError("");
        }}
      />
    );
  return (
    <Screen>
      <View
        style={{
          width: "100%",
          maxWidth: user ? 560 : sideBySide ? 880 : 460,
          alignSelf: "center",
          gap: 18,
          paddingTop: width > 700 ? 16 : 8,
        }}
      >
        {user && <Heading title="Mi cuenta" subtitle="Tu acceso a ExpoTec" />}
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
        <Card
          style={{
            padding: width > 700 ? 28 : 20,
            gap: sideBySide ? 32 : 14,
            borderRadius: 20,
            flexDirection: sideBySide ? "row" : "column",
            alignItems: sideBySide ? "center" : "stretch",
          }}
        >
          {!ready ? (
            <View style={{ gap: 12 }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={paragraph}>Recuperando tu sesión…</Text>
            </View>
          ) : user ? (
            <View style={{ gap: 16 }}>
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
                Tu cuenta, los espacios, los proyectos, el inventario y los
                préstamos se guardan en el servidor. La presentación de la
                demostración conserva sus ejemplos locales.
              </Text>
              {!!sessionError && (
                <Button
                  title={busy ? "Conectando…" : "Reintentar conexión"}
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
              )}
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
            </View>
          ) : sessionError ? (
            <View style={{ gap: 16 }}>
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
            </View>
          ) : socialPending ? null : (
            <View
              style={{ gap: 14, flex: sideBySide ? 1 : undefined, minWidth: 0 }}
            >
              <View style={{ gap: 10, marginBottom: 4 }}>
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 22,
                    fontWeight: "700",
                    letterSpacing: -1,
                  }}
                >
                  expotec.
                </Text>
                <Text
                  accessibilityRole="header"
                  style={{
                    color: colors.text,
                    fontSize: 30,
                    lineHeight: 36,
                    fontWeight: "700",
                    letterSpacing: -0.9,
                  }}
                >
                  {register ? "Creá tu cuenta" : "Iniciá sesión"}
                </Text>
                <Text style={paragraph}>
                  {register
                    ? "Elegí cómo vas a participar. La escuela asigna los permisos de organización."
                    : "Ingresá a tu cuenta para participar de la ExpoTec."}
                </Text>
              </View>
              {register && (
                <>
                  <Choice
                    label="Tipo de cuenta"
                    value={accountType}
                    options={[
                      { value: "student", label: "Alumno" },
                      { value: "guest", label: "Invitado" },
                    ]}
                    disabled={busy}
                    onChange={(value) =>
                      setAccountType(value as "student" | "guest")
                    }
                  />
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
                    setTouched((current) => ({
                      ...current,
                      confirmation: true,
                    }));
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
                endIcon="arrowRight"
                style={{
                  alignSelf: "stretch",
                  minHeight: 50,
                  borderRadius: 12,
                }}
              />
              {!register && recoveryEnabled && (
                <Button
                  title="Olvidé mi contraseña"
                  variant="quiet"
                  disabled={busy}
                  onPress={() => setRecovering(true)}
                />
              )}
              <View
                style={{
                  gap: 2,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  flexWrap: "wrap",
                }}
              >
                <Text style={{ ...paragraph, fontSize: 14 }}>
                  {register
                    ? "¿Ya tenés una cuenta?"
                    : "¿Primera vez en ExpoTec?"}
                </Text>
                <Button
                  title={register ? "Ya tengo una cuenta" : "Crear una cuenta"}
                  variant="quiet"
                  disabled={busy}
                  style={{ alignSelf: "center" }}
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
              </View>
            </View>
          )}
          <SocialAccess
            onPendingChange={setSocialPending}
            onAvailableChange={setHasSocialProviders}
            sideBySide={sideBySide}
            disabled={busy}
          />
        </Card>
      </View>
    </Screen>
  );
}
