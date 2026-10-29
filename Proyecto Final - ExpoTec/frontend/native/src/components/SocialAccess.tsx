/**
 * Acceso con Google, Discord y GitHub. Muestra solo los proveedores
 * configurados en el servidor y, al volver del proveedor, permite ingresar,
 * vincular una cuenta existente (con su contraseña de ExpoTec) o completar el alta.
 *
 * Las piezas visuales están en `components/social/` (botón de proveedor,
 * título y formulario de alta o vinculación).
 */
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { Button } from "./ui";
import { ProviderButton } from "./social/ProviderButton";
import { SocialHeading } from "./social/SocialHeading";
import { SocialCompleteForm } from "./social/SocialCompleteForm";
import type { Provider, SocialInput, SocialStatus } from "./social/types";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { hasSocialReturn, socialBridge } from "../lib/socialBridge";
import { validateCredentials } from "../lib/authValidation";
import { AuthError } from "../lib/authTypes";

/** Botones de proveedores y formulario para completar el acceso. */
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
  const [status, setStatus] = useState<SocialStatus | null>(null);
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
      .query<{ providers: Provider[] }>("/api/auth/social/providers/query", {})
      .then((result) => {
        if (active) setProviders(result.providers);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [client]);
  /** Ejecuta una acción mostrando carga y errores. */
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
      .query<SocialStatus>(
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
  /** Completa el acceso según el modo indicado por la API. */
  async function complete(access: SocialStatus) {
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
  /** Actualiza un campo del formulario de alta o vinculación. */
  function update(key: keyof SocialInput, value: string) {
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
  /** Limpia el flujo pendiente y cierra el formulario. */
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
      <SocialHeading
        pending={!!pending}
        status={status}
        sideBySide={sideBySide}
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
            <SocialCompleteForm
              status={status}
              input={input}
              fields={fields}
              accountType={accountType}
              busy={busy}
              onAccountType={setAccountType}
              onChange={update}
              onSubmit={finish}
            />
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
