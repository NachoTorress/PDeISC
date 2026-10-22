import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import type { AccountRole } from "../lib/authTypes";
import { Button } from "./ui";
import { Icon } from "./Icon";

const roles: Record<AccountRole, string> = {
  guest: "Invitado",
  student: "Alumno",
  teacher: "Profesor",
  loans: "Encargado de préstamos",
  admin: "Administrador",
};

export default function AccountMenu({ onSignIn }: { onSignIn: () => void }) {
  const { user, ready, client, error: sessionError } = useAuth();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const trigger = useRef<View>(null);
  const closeButton = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const working = useRef(false);
  useEffect(() => {
    setOpen(false);
    setConfirm(false);
    setError("");
  }, [user?.id]);
  function close() {
    if (working.current) return;
    setOpen(false);
    setConfirm(false);
    setError("");
    if (Platform.OS === "web")
      (trigger.current as unknown as { focus?: () => void })?.focus?.();
  }
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
          : "No pudimos completar la operación.",
      );
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  if (!user)
    return (
      <Button
        title="Ingresar"
        icon="users"
        variant="quiet"
        disabled={!ready}
        onPress={onSignIn}
      />
    );
  return (
    <>
      <Pressable
        ref={trigger}
        accessibilityRole="button"
        accessibilityLabel="Abrir menú de cuenta"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          minHeight: 44,
          paddingHorizontal: 12,
          borderRadius: 10,
          backgroundColor:
            pressed || open ? colors.surfaceVariant : "transparent",
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        })}
      >
        <Icon name="users" color={colors.text} size={21} />
        {width > 420 && (
          <Text
            numberOfLines={1}
            style={{ color: colors.text, maxWidth: 140, fontWeight: "600" }}
          >
            {user.firstName}
          </Text>
        )}
        <Icon name="chevronDown" color={colors.muted} size={16} />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
        onShow={() => {
          if (Platform.OS === "web")
            (
              closeButton.current as unknown as { focus?: () => void }
            )?.focus?.();
        }}
      >
        <View style={{ flex: 1 }} accessibilityViewIsModal>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar menú de cuenta al tocar afuera"
            onPress={close}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: "rgba(0,0,0,0.18)",
            }}
          />
          <ScrollView
            style={{
              position: "absolute",
              top: insets.top + 64,
              right: 16,
              width: Math.min(320, width - 32),
              maxHeight: "80%",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.outline,
              backgroundColor: colors.surface,
            }}
            contentContainerStyle={{ padding: 20, gap: 14 }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Text
                accessibilityRole="header"
                style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: "600",
                  flex: 1,
                }}
              >
                {user.firstName} {user.lastName}
              </Text>
              <Pressable
                ref={closeButton}
                accessibilityRole="button"
                accessibilityLabel="Cerrar menú de cuenta"
                disabled={busy}
                onPress={close}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="close" color={colors.text} size={20} />
              </Pressable>
            </View>
            <Text selectable style={{ color: colors.muted, lineHeight: 21 }}>
              {user.email}
            </Text>
            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.text, fontWeight: "600" }}>
                Permisos disponibles
              </Text>
              {user.roles.length ? (
                user.roles.map((role) => (
                  <View
                    key={role}
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <Icon name="check" color={colors.primary} size={16} />
                    <Text style={{ color: colors.text, flex: 1 }}>
                      {roles[role]}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.muted }}>
                  Sin permisos asignados
                </Text>
              )}
            </View>
            {!!(error || sessionError) && (
              <Text
                accessibilityRole="alert"
                style={{ color: colors.error, lineHeight: 21 }}
              >
                {error || sessionError}
              </Text>
            )}
            {!!sessionError && (
              <Button
                title={busy ? "Conectando…" : "Reintentar conexión"}
                variant="secondary"
                disabled={busy}
                onPress={() =>
                  void run(async () => {
                    await client.verify();
                  })
                }
              />
            )}
            {confirm ? (
              <View style={{ gap: 10 }}>
                <Text style={{ color: colors.text }}>
                  ¿Cerrar sesión en este dispositivo?
                </Text>
                <Button
                  title={busy ? "Cerrando…" : "Sí, cerrar sesión"}
                  variant="danger"
                  disabled={busy}
                  onPress={() =>
                    void run(async () => {
                      await client.signOut();
                      setOpen(false);
                      setConfirm(false);
                    })
                  }
                />
                <Button
                  title="Cancelar"
                  variant="quiet"
                  disabled={busy}
                  onPress={() => setConfirm(false)}
                />
              </View>
            ) : (
              <Button
                title="Cerrar sesión"
                variant="quiet"
                onPress={() => setConfirm(true)}
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
