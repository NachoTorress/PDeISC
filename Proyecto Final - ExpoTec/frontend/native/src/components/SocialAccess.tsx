import { useEffect, useRef, useState } from "react";
import { Platform, Text, View } from "react-native";
import { Button, Card, Choice, Field, Heading } from "./ui";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { hasSocialReturn, socialBridge } from "../lib/socialBridge";
import { validateCredentials } from "../lib/authValidation";
import { AuthError } from "../lib/authTypes";

type Provider = { id: string; name: string };
type Status = {
  provider: string;
  email: string;
  mode: "signup" | "link" | "login";
};
const names: Record<string, string> = {
  google: "Google",
  discord: "Discord",
  github: "GitHub",
};
export function SocialAccess({
  onPendingChange,
}: {
  onPendingChange: (pending: boolean) => void;
}) {
  const { client, user, ready } = useAuth();
  const { colors } = useTheme();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [pending, setPending] = useState(socialBridge.pending);
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState(
    hasSocialReturn && !pending
      ? "Este acceso no pertenece a esta pestaña o venció. Volvé a iniciarlo."
      : "",
  );
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [input, setInput] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmation: "",
  });
  const [accountType, setAccountType] = useState<"student" | "guest">("guest");
  const working = useRef(false);
  const text = { color: colors.muted, fontSize: 15, lineHeight: 22 };
  useEffect(() => {
    onPendingChange(Boolean(pending));
  }, [pending, onPendingChange]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    let active = true;
    void client
      .query<{ providers: Provider[] }>("/api/auth/social/providers/query")
      .then((result) => {
        if (active) setProviders(result.providers);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [client]);
  async function run(action: () => Promise<void>) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos completar el acceso.",
      );
      if (cause instanceof AuthError) setFields(cause.fields);
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!pending) return;
    let active = true;
    void client
      .query<Status>("/api/auth/browser/social/status", pending)
      .then((result) => {
        if (active) setStatus(result);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "No pudimos verificar el acceso.",
          );
      });
    return () => {
      active = false;
    };
  }, [client, pending]);
  function update(key: keyof typeof input, value: string) {
    const next = { ...input, [key]: value };
    setInput(next);
    if (status && status.mode !== "login") {
      const validation = validateCredentials(
        { email: status.email, ...next },
        status.mode === "signup",
      );
      if (status.mode === "signup" && next.confirmation !== next.password)
        validation.confirmation = "Las contraseñas deben coincidir.";
      setFields((current) => ({ ...current, [key]: validation[key] ?? "" }));
    }
  }
  function finish() {
    if (!status || !pending) return;
    const validation =
      status.mode === "login"
        ? {}
        : validateCredentials(
            { email: status.email, ...input },
            status.mode === "signup",
          );
    if (status.mode === "signup" && input.confirmation !== input.password)
      validation.confirmation = "Las contraseñas deben coincidir.";
    setFields(validation);
    if (Object.keys(validation).length) return;
    void run(async () => {
      await client.completeSocial({
        ...pending,
        mode: status.mode,
        ...(status.mode === "login" ? {} : { password: input.password }),
        ...(status.mode === "signup"
          ? {
              firstName: input.firstName,
              lastName: input.lastName,
              accountType,
            }
          : {}),
      });
      socialBridge.clear();
      setPending(null);
      setStatus(null);
      setInput({ firstName: "", lastName: "", password: "", confirmation: "" });
    });
  }
  if (
    Platform.OS !== "web" ||
    !ready ||
    (!pending && user) ||
    (!providers.length && !pending && !error)
  )
    return null;
  return (
    <Card>
      <Heading
        title={pending ? "Completar acceso" : "Ingresar con otra cuenta"}
      />
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ ...text, color: colors.error }}
        >
          {error}
        </Text>
      )}
      {pending ? (
        <>
          {!status ? (
            <Text style={text}>
              {error
                ? "Reiniciá el acceso para volver a intentarlo."
                : "Verificando el acceso…"}
            </Text>
          ) : (
            <>
              <Text selectable style={text}>
                {names[status.provider]} · {status.email}
              </Text>
              <Text style={text}>
                {status.mode === "signup"
                  ? "Creá también una contraseña propia de ExpoTec. Después podrás ingresar con este proveedor o con tu correo y contraseña."
                  : status.mode === "link"
                    ? "Este correo ya tiene una cuenta. Ingresá su contraseña de ExpoTec para autorizar la vinculación."
                    : "Este acceso ya está vinculado a tu cuenta de ExpoTec."}
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
                    onChange={(value) =>
                      setAccountType(value as "student" | "guest")
                    }
                    disabled={busy}
                  />
                  <Field
                    label="Nombre"
                    value={input.firstName}
                    onChangeText={(value) => update("firstName", value)}
                    error={fields.firstName}
                    maxLength={80}
                    editable={!busy}
                    autoComplete="given-name"
                  />
                  <Field
                    label="Apellido"
                    value={input.lastName}
                    onChangeText={(value) => update("lastName", value)}
                    error={fields.lastName}
                    maxLength={80}
                    editable={!busy}
                    autoComplete="family-name"
                  />
                </>
              )}
              {status.mode !== "login" && (
                <Field
                  label="Contraseña de ExpoTec"
                  value={input.password}
                  onChangeText={(value) => update("password", value)}
                  error={fields.password}
                  hint={
                    status.mode === "signup"
                      ? "Entre 12 y 128 caracteres."
                      : undefined
                  }
                  secureTextEntry
                  maxLength={128}
                  editable={!busy}
                  autoComplete={
                    status.mode === "signup"
                      ? "new-password"
                      : "current-password"
                  }
                />
              )}
              {status.mode === "signup" && (
                <Field
                  label="Repetir contraseña de ExpoTec"
                  value={input.confirmation}
                  onChangeText={(value) => update("confirmation", value)}
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
                      : status.mode === "link"
                        ? "Vincular e ingresar"
                        : "Ingresar a ExpoTec"
                }
                onPress={finish}
                disabled={busy}
              />
            </>
          )}
          <Button
            title="Cancelar acceso"
            variant="quiet"
            disabled={busy}
            onPress={() => {
              socialBridge.clear();
              setPending(null);
              setStatus(null);
              setError("");
              setInput({
                firstName: "",
                lastName: "",
                password: "",
                confirmation: "",
              });
            }}
          />
        </>
      ) : (
        <View style={{ gap: 8 }}>
          {providers.map((provider) => (
            <Button
              key={provider.id}
              title={`Continuar con ${provider.name}`}
              variant="secondary"
              disabled={busy}
              onPress={() => {
                void run(async () => {
                  const { challenge } = await socialBridge.begin();
                  const result = await client.query<{
                    id: string;
                    url: string;
                  }>("/api/auth/browser/social/start", {
                    provider: provider.id,
                    challenge,
                  });
                  socialBridge.redirect(result.id, result.url);
                });
              }}
            />
          ))}
        </View>
      )}
    </Card>
  );
}
