/**
 * Pantalla del sistema compartido (datos de la API). Mi cuenta: ingreso,
 * registro (alumno o invitado), accesos sociales, recuperación de contraseña
 * y datos de la sesión. Las partes del formulario están en
 * `components/account/`.
 */
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Button, Card, CheckRow, Field, Screen } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { AuthError } from "../lib/authTypes";
import type { Credentials } from "../lib/authTypes";
import { validateCredentials } from "../lib/authValidation";
import { SocialAccess } from "../components/SocialAccess";
import { socialBridge } from "../lib/socialBridge";
import { passwordReset } from "../lib/passwordReset";
import PasswordRecovery from "../components/PasswordRecovery";
import { AccountIntro } from "../components/account/AccountIntro";
import { RegisterFields } from "../components/account/RegisterFields";
import { AccountSwitch } from "../components/account/AccountSwitch";

const empty: Credentials = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
};

/** Formulario de ingreso/registro o resumen de la cuenta si ya hay sesión. */
export default function AccountPage({
  onSignedIn,
}: {
  onSignedIn: () => void;
}) {
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
  const working = useRef(false);
  useEffect(() => {
    if (user && !socialPending && resetToken === null && !recovering)
      onSignedIn();
  }, [user, socialPending, resetToken, recovering, onSignedIn]);
  const validation = validateCredentials(input, register);
  if (register && confirmation !== input.password)
    validation.confirmation = "Las contraseñas deben coincidir.";
  const fieldError = (key: string) =>
    serverFields[key] || (touched[key] ? validation[key] : undefined);
  /** Actualiza un campo y borra su error. */
  function update(key: keyof Credentials, value: string) {
    setInput((current) => ({ ...current, [key]: value }));
    setTouched((current) => ({ ...current, [key]: true }));
    setServerFields((current) => ({ ...current, [key]: "" }));
    setError("");
    setMessage("");
  }
  /** Ejecuta una acción mostrando carga, éxito o error. */
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
  /** Valida en el cliente y envía el ingreso o registro. */
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
  /** Cambia entre ingreso y registro, limpiando el formulario. */
  function switchMode() {
    setRegister(!register);
    setInput(empty);
    setConfirmation("");
    setTouched({});
    setServerFields({});
    setError("");
    setMessage("");
    setShowPassword(false);
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
          maxWidth: sideBySide ? 880 : 460,
          alignSelf: "center",
          gap: 14,
          paddingTop: width > 700 ? 16 : 0,
        }}
      >
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
            padding: width > 700 ? 28 : 16,
            gap: sideBySide ? 32 : 14,
            borderRadius: 16,
            flexDirection: sideBySide ? "row" : "column",
            alignItems: sideBySide ? "center" : "stretch",
          }}
        >
          {!ready ? (
            <View style={{ gap: 12 }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={paragraph}>Recuperando tu sesión…</Text>
            </View>
          ) : user ? null : sessionError ? (
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
              <AccountIntro register={register} />
              {register && (
                <RegisterFields
                  accountType={accountType}
                  input={input}
                  busy={busy}
                  fieldError={fieldError}
                  onAccountType={setAccountType}
                  onChange={update}
                />
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
                  minHeight: 48,
                  borderRadius: 10,
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
              <AccountSwitch
                register={register}
                busy={busy}
                onSwitch={switchMode}
              />
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
