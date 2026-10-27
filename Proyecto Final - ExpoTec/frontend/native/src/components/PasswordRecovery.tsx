/**
 * Recuperación de contraseña: pedir el enlace por correo o elegir la contraseña nueva con el token del enlace.
 */
import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { validateCredentials } from "../lib/authValidation";
import { AuthError } from "../lib/authTypes";
import { passwordReset } from "../lib/passwordReset";
import { Button, Card, CheckRow, Field, Heading, Screen } from "./ui";

/** Formulario en dos modos: solicitud o cambio. */
export default function PasswordRecovery({
  token,
  initialEmail,
  onClose,
}: {
  token: string | null;
  initialEmail: string;
  onClose: () => void;
}) {
  const { client } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [show, setShow] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const working = useRef(false);
  const resetting = token !== null;
  const emailError = validateCredentials({ email, password: "x" }, false).email;
  const passwordError =
    password.length < 12 || password.length > 128
      ? "Usá entre 12 y 128 caracteres."
      : "";
  const confirmationError =
    password !== confirmation ? "Las contraseñas deben coincidir." : "";
  const invalidToken = resetting && !/^[A-Za-z0-9_-]{43}$/.test(token);
  /** Valida y envía `POST /api/auth/recovery/request` o `/complete`. */
  async function submit() {
    setAttempted(true);
    if (
      working.current ||
      invalidToken ||
      (resetting ? passwordError || confirmationError : emailError)
    )
      return;
    working.current = true;
    setBusy(true);
    setError("");
    setFields({});
    try {
      const result = await client.query<{ message: string }>(
        `/api/auth/recovery/${resetting ? "complete" : "request"}`,
        resetting
          ? { token, password, confirmation }
          : { email: email.trim().toLowerCase() },
      );
      if (resetting) {
        passwordReset.clear();
        await client.forgetAfterRecovery();
        setPassword("");
        setConfirmation("");
      }
      setMessage(result.message);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos completar la recuperación.",
      );
      if (cause instanceof AuthError) setFields(cause.fields);
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Card
        style={{
          width: "100%",
          maxWidth: 460,
          alignSelf: "center",
          padding: 24,
        }}
      >
        <Heading
          title={
            resetting ? "Elegí tu nueva contraseña" : "Recuperá tu contraseña"
          }
          subtitle={
            resetting
              ? "Actualizá tu acceso a ExpoTec."
              : "Te enviaremos un enlace al correo de tu cuenta."
          }
        />
        {message ? (
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: colors.success, lineHeight: 23 }}
          >
            {message}
          </Text>
        ) : (
          <>
            {invalidToken ? (
              <Text accessibilityRole="alert" style={{ color: colors.error }}>
                El enlace no es válido. Volvé a iniciar sesión y solicitá un
                enlace nuevo desde «Olvidé mi contraseña».
              </Text>
            ) : resetting ? (
              <>
                <Field
                  label="Nueva contraseña"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setFields({});
                  }}
                  secureTextEntry={!show}
                  autoComplete="new-password"
                  maxLength={128}
                  editable={!busy}
                  hint="Entre 12 y 128 caracteres."
                  error={fields.password || (attempted ? passwordError : "")}
                />
                <Field
                  label="Repetir nueva contraseña"
                  value={confirmation}
                  onChangeText={(value) => {
                    setConfirmation(value);
                    setFields({});
                  }}
                  secureTextEntry={!show}
                  autoComplete="new-password"
                  maxLength={128}
                  editable={!busy}
                  error={
                    fields.confirmation || (attempted ? confirmationError : "")
                  }
                />
                <CheckRow
                  label="Mostrar contraseña"
                  checked={show}
                  onChange={setShow}
                />
                <Text style={{ color: colors.muted, lineHeight: 21 }}>
                  Al guardar se cerrarán las sesiones anteriores. Después
                  ingresá con la contraseña nueva.
                </Text>
              </>
            ) : (
              <Field
                label="Correo electrónico de tu cuenta"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setFields({});
                }}
                keyboardType="email-address"
                autoComplete="email"
                maxLength={254}
                editable={!busy}
                error={fields.email || (attempted ? emailError : "")}
              />
            )}
            {!!error && (
              <Text
                accessibilityRole="alert"
                style={{ color: colors.error, lineHeight: 21 }}
              >
                {error}
              </Text>
            )}
            <Button
              title={
                busy
                  ? "Procesando…"
                  : resetting
                    ? "Guardar nueva contraseña"
                    : "Enviar enlace de recuperación"
              }
              disabled={busy || invalidToken}
              onPress={() => void submit()}
            />
          </>
        )}
        <View>
          <Button
            title="Volver a iniciar sesión"
            variant="quiet"
            disabled={busy}
            onPress={onClose}
          />
        </View>
      </Card>
    </Screen>
  );
}
