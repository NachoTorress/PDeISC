import { useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";
import { useReducedMotion } from "../hooks/useReducedMotion";

export type NavigationItem = {
  id: string;
  label: string;
  icon: IconName;
  onPress: () => void;
};

export function AppNavigation({
  items,
  activeId,
  desktop,
  open,
  onClose,
}: {
  items: NavigationItem[];
  activeId: string;
  desktop: boolean;
  open: boolean;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const closeButton = useRef<View>(null);
  const [focusedItem, setFocusedItem] = useState<string | null>(null);
  function content(mobile: boolean) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.navigation }}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            accessibilityRole="header"
            style={{
              color: colors.navigationMuted,
              fontSize: 12,
              fontWeight: "600",
            }}
          >
            La exposición
          </Text>
          {mobile && (
            <Pressable
              ref={closeButton}
              accessibilityRole="button"
              accessibilityLabel="Cerrar menú"
              onPress={onClose}
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="close" color={colors.onNavigation} size={22} />
            </Pressable>
          )}
        </View>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingBottom: 24,
            gap: 8,
          }}
        >
          {items.map((item) => {
            const selected = item.id === activeId;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                {...(Platform.OS === "web"
                  ? { "aria-current": selected ? "page" : undefined }
                  : { accessibilityState: { selected } })}
                onPress={() => {
                  onClose();
                  item.onPress();
                }}
                onFocus={() => setFocusedItem(item.id)}
                onBlur={() => setFocusedItem(null)}
                style={({ pressed }) => ({
                  minHeight: 48,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  borderRadius: 10,
                  backgroundColor: selected
                    ? colors.navigationSelected
                    : pressed
                      ? colors.navigationSelected
                      : "transparent",
                  borderWidth: 2,
                  borderColor:
                    focusedItem === item.id ? colors.navigationAccent : "transparent",
                })}
              >
                <Icon
                  name={item.icon}
                  color={selected ? colors.navigationAccent : colors.navigationMuted}
                  size={21}
                />
                <Text
                  style={{
                    flex: 1,
                    color: selected ? colors.navigationAccent : colors.onNavigation,
                    fontSize: 14,
                    lineHeight: 21,
                    fontWeight: "600",
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }
  if (desktop)
    return (
      <View
        role="navigation"
        accessibilityLabel="Navegación principal"
        style={{ width: 248, borderRightWidth: 1, borderColor: colors.navigation }}
      >
        {content(false)}
      </View>
    );
  return (
    <Modal
      visible={open}
      transparent
      animationType={reducedMotion ? "none" : "fade"}
      onRequestClose={onClose}
      onShow={() => {
        if (Platform.OS === "web")
          (closeButton.current as unknown as { focus?: () => void })?.focus?.();
      }}
    >
      <View style={{ flex: 1, flexDirection: "row" }} accessibilityViewIsModal>
        <View
          style={{
            width: "84%",
            maxWidth: 320,
            height: "100%",
            borderRightWidth: 1,
            borderColor: colors.outline,
          }}
        >
          {content(true)}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar menú al tocar afuera"
          onPress={onClose}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.38)" }}
        />
      </View>
    </Modal>
  );
}
