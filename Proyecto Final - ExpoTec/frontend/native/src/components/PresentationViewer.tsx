/** Visor inmersivo compartido por la muestra pública y la demostración. */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Modal,
  Platform,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "./Icon";

function Control({
  label,
  icon,
  onPress,
  text,
  onFocus,
  onBlur,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
  text?: string;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onFocus={() => {
        setFocused(true);
        onFocus();
      }}
      onBlur={() => {
        setFocused(false);
        onBlur();
      }}
      style={({ pressed }) => ({
        minWidth: 44,
        minHeight: 44,
        paddingHorizontal: text ? 12 : 8,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: pressed ? "#425477" : "#25324b",
        borderWidth: 1,
        borderColor: focused ? "#b3c4ff" : "#607292",
      })}
    >
      <Icon name={icon} color="#f5f7ff" size={22} />
      {!!text && (
        <Text style={{ color: "#f5f7ff", fontSize: 14, fontWeight: "600" }}>
          {text}
        </Text>
      )}
    </Pressable>
  );
}

export function PresentationViewer({
  children,
  playing,
  index,
  total,
  message,
  onClose,
  onToggle,
  onNext,
  onPrevious,
  muted,
  onMute,
  onContinue,
}: {
  children: ReactNode;
  playing: boolean;
  index: number;
  total: number;
  message?: string;
  onClose: () => void;
  onToggle: () => void;
  onNext: () => void;
  onPrevious: () => void;
  muted: boolean;
  onMute: () => void;
  onContinue?: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [controls, setControls] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stage = useRef<View>(null);
  const controlFocused = useRef(false);
  const reveal = useCallback(() => {
    setControls(true);
    if (timer.current) clearTimeout(timer.current);
    if (playing && !message)
      timer.current = setTimeout(() => {
        if (!controlFocused.current) setControls(false);
      }, 3500);
  }, [playing, message]);
  useEffect(() => {
    reveal();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [reveal]);
  const showControls = controls || !playing || !!message;
  const focusEvents = {
    onFocus: () => {
      controlFocused.current = true;
      reveal();
    },
    onBlur: () => {
      controlFocused.current = false;
      reveal();
    },
  };
  const padding = width < 600 || height < 600 ? 16 : 40;
  return (
    <Modal
      visible
      animationType="none"
      presentationStyle="fullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
      onShow={() => {
        if (Platform.OS === "web")
          (stage.current as unknown as { focus?: () => void })?.focus?.();
      }}
      supportedOrientations={["portrait", "landscape"]}
    >
      <View
        ref={stage}
        tabIndex={-1}
        testID="presentation-viewer"
        accessibilityViewIsModal
        onPointerMove={reveal}
        onTouchStart={reveal}
        onAccessibilityEscape={onClose}
        style={{
          flex: 1,
          backgroundColor: "#0b1220",
          paddingTop: Math.max(insets.top, padding),
          paddingHorizontal: padding,
          paddingBottom: Math.max(insets.bottom, 12),
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: padding,
            gap: 12,
          }}
        >
          <Text
            style={{
              color: "#f5f7ff",
              fontSize: width < 600 ? 20 : 26,
              fontWeight: "700",
            }}
          >
            expotec<Text style={{ color: "#b3c4ff" }}>.</Text>
          </Text>
          <Text style={{ color: "#aebbd3", fontSize: width < 600 ? 13 : 18 }}>
            {!playing ? "Pausada · " : ""}
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(total).padStart(2, "0")}
          </Text>
        </View>
        <View style={{ flex: 1, minHeight: 0 }}>{children}</View>
        <View
          style={{ minHeight: 66, paddingTop: 12, justifyContent: "center" }}
        >
          <View
            accessibilityElementsHidden={!showControls}
            importantForAccessibility={
              showControls ? "auto" : "no-hide-descendants"
            }
            pointerEvents={showControls ? "auto" : "none"}
            style={{ opacity: showControls ? 1 : 0, gap: 8 }}
          >
            {!!message && (
              <Text
                accessibilityRole="alert"
                numberOfLines={2}
                style={{ color: "#ffd0a8", fontSize: 14, textAlign: "center" }}
              >
                {message}
              </Text>
            )}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: width < 360 ? 4 : 10,
              }}
            >
              <Control
                {...focusEvents}
                label="Proyecto anterior"
                icon="arrowLeft"
                onPress={onPrevious}
              />
              <Control
                {...focusEvents}
                label={
                  playing ? "Pausar presentación" : "Reanudar presentación"
                }
                icon={playing ? "pause" : "play"}
                onPress={onContinue ?? onToggle}
              />
              <Control
                {...focusEvents}
                label="Proyecto siguiente"
                icon="arrowRight"
                onPress={onNext}
              />
              <Control
                {...focusEvents}
                label={muted ? "Activar sonido" : "Silenciar videos"}
                icon={muted ? "soundOff" : "sound"}
                onPress={onMute}
              />
              <Control
                {...focusEvents}
                label="Salir de la presentación"
                icon="close"
                onPress={onClose}
                text="Salir"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
