import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { Button, Choice, Field, Heading } from "./ui";
import { SocialProviderIcon } from "./SocialProviderIcon";
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
  onAvailableChange,
  sideBySide = false,
  disabled = false,
}: {
  onPendingChange: (pending: boolean) => void;
  onAvailableChange: (available: boolean) => void;
  sideBySide?: boolean;
  disabled?: boolean;
}) {
  const { client, user, ready } = useAuth();
  const { colors } = useTheme();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [pending, setPending] = useState(socialBridge.pending);
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState(
    hasSocialReturn && !pending
      ? "Este acceso no pertenece a esta sesión o venció. Volvé a iniciarlo."
      : "",
  );
  const [busy, setBusy] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
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
    onAvailableChange(providers.length > 0);
  }, [providers.length, onAvailableChange]);
  useEffect(() => {
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
      .query<Status>(
        `/api/auth/${Platform.OS === "web" ? "browser/" : ""}social/status`,
        pending,
      )
      .then((result) => {
        if (!active) return;
        setStatus(result);
        if (result.mode === "login") void run(() => complete(result));
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
  async function complete(access: Status) {
    if (!pending) return;
    await client.completeSocial({
      ...pending,
      mode: access.mode,
      ...(access.mode === "login" ? {} : { password: input.password }),
      ...(access.mode === "signup"
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
  }
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
    void run(() => complete(status));
  }
  if (!ready || (!pending && user) || (!providers.length && !pending && !error))
    return null;
  return (
    <View
      style={{
        gap: 16,
        width: sideBySide ? 300 : undefined,
        paddingLeft: sideBySide ? 28 : 0,
        paddingVertical: sideBySide ? 24 : 0,
        borderLeftWidth: sideBySide ? 1 : 0,
        borderLeftColor: colors.outline,
      }}
    >
      {pending ? (
        <Heading
          title={
            !status
              ? "Ingresando a ExpoTec"
              : status.mode === "signup"
                ? "Creá tu cuenta de ExpoTec"
                : status.mode === "link"
                  ? "Vinculá tu cuenta existente"
                  : "Ingresando a ExpoTec"
          }
        />
      ) : sideBySide ? (
        <View style={{ gap: 8 }}>
          <Text
            accessibilityRole="header"
            style={{
              color: colors.text,
              fontSize: 20,
              fontWeight: "600",
              letterSpacing: -0.4,
            }}
          >
            Continuá con otra cuenta
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
            También podés usar estos medios para ingresar.
          </Text>
        </View>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{ flex: 1, height: 1, backgroundColor: colors.outline }}
          />
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            O continuá con
          </Text>
          <View
            style={{ flex: 1, height: 1, backgroundColor: colors.outline }}
          />
        </View>
      )}
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
          {!status || status.mode === "login" ? (
            <View style={{ gap: 12 }}>
              {!error && <ActivityIndicator color={colors.primary} />}
              <Text style={text} accessibilityLiveRegion="polite">
                {error
                  ? "No pudimos completar el ingreso. Volvé a intentarlo."
                  : "Estamos abriendo tu cuenta…"}
              </Text>
              {status?.mode === "login" && !!error && (
                <Button
                  title="Reintentar ingreso"
                  onPress={finish}
                  disabled={busy}
                />
              )}
            </View>
          ) : (
            <>
              <Text selectable style={text}>
                {names[status.provider]} · {status.email}
              </Text>
              <Text style={text}>
                {status.mode === "signup"
                  ? "Creá también una contraseña propia de ExpoTec. Después podrás ingresar con este proveedor o con tu correo y contraseña."
                  : `Tu cuenta de ExpoTec ya existe. Confirmá tu contraseña actual para vincular ${names[status.provider]}. Conservás tu contraseña y tus permisos. En los próximos accesos con ${names[status.provider]} no te la pediremos.`}
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
              <Field
                label={
                  status.mode === "signup"
                    ? "Crear contraseña de ExpoTec"
                    : "Tu contraseña actual de ExpoTec"
                }
                value={input.password}
                onChangeText={(value) => update("password", value)}
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
                      : "Vincular e ingresar"
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
            <ProviderButton
              key={provider.id}
              provider={provider}
              disabled={busy || disabled}
              busy={busy && activeProvider === provider.id}
              onPress={() => {
                setActiveProvider(provider.id);
                void run(async () => {
                  await socialBridge.start(provider.id, client.query);
                  setPending(socialBridge.pending());
                });
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function ProviderButton({
  provider,
  disabled,
  busy,
  onPress,
}: {
  provider: Provider;
  disabled: boolean;
  busy: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Continuar con ${provider.name}`}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => ({
        minHeight: 50,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: focused ? colors.primary : colors.controlOutline,
        backgroundColor:
          pressed || hovered ? colors.surfaceVariant : colors.surface,
        opacity: disabled ? 0.55 : 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      })}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <SocialProviderIcon
          provider={provider.id}
          color={
            provider.id === "discord"
              ? colors.dark
                ? "#a4adff"
                : "#5865F2"
              : colors.text
          }
        />
      )}
      <Text
        style={{
          color: colors.text,
          fontSize: 15,
          fontWeight: "600",
          flexShrink: 1,
          textAlign: "center",
        }}
      >
        Continuar con {provider.name}
      </Text>
    </Pressable>
  );
}
