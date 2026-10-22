import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Button, Field } from "./ui";
import GalleryImage from "./GalleryImage";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { managedPhoto, uploadPhoto } from "../lib/photoUpload";
import type { PhotoPurpose } from "../lib/photoUpload";
import { preparePhoto } from "../lib/preparePhoto";

export default function PhotoUploadField({
  value,
  onChange,
  purpose,
  disabled = false,
  error,
  onBusyChange,
}: {
  value: string;
  onChange: (value: string) => void;
  purpose: PhotoPurpose;
  disabled?: boolean;
  error?: string;
  onBusyChange: (busy: boolean) => void;
}) {
  const { client } = useAuth(),
    { colors } = useTheme();
  const [busy, setBusy] = useState(false),
    [percent, setPercent] = useState(0);
  const [failure, setFailure] = useState(""),
    [linkMode, setLinkMode] = useState(Boolean(value && !managedPhoto(value)));
  const [preview, setPreview] = useState("");
  const controller = useRef<AbortController | null>(null);
  const selecting = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    onBusyChange(busy);
  }, [busy, onBusyChange]);
  async function choose() {
    if (selecting.current || disabled || busy) return;
    selecting.current = true;
    setFailure("");
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
        quality: 1,
      });
      if (!mounted.current || picked.canceled) return;
      const abort = new AbortController();
      controller.current = abort;
      setBusy(true);
      setPercent(0);
      setPreview(picked.assets[0].uri);
      const photo = await preparePhoto(picked.assets[0]);
      abort.signal.throwIfAborted();
      const imageUrl = await uploadPhoto(
        photo,
        purpose,
        client.send,
        (p) => {
          if (mounted.current) setPercent(p);
        },
        abort.signal,
      );
      if (!mounted.current) return;
      onChange(imageUrl);
      setLinkMode(false);
      setPreview("");
    } catch (cause) {
      if (mounted.current && !controller.current?.signal.aborted) {
        setFailure(
          cause instanceof Error
            ? cause.message
            : "No pudimos subir la foto. Probá nuevamente.",
        );
        setPreview("");
      }
    } finally {
      selecting.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const shown = preview || (managedPhoto(value) ? value : "");
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
        Foto
      </Text>
      {!!shown && (
        <GalleryImage
          key={shown}
          uri={shown}
          caption="Vista previa de la foto"
        />
      )}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <Button
          title={
            busy
              ? percent >= 90
                ? "Preparando foto…"
                : `Subiendo… ${percent}%`
              : value
                ? "Cambiar foto"
                : "Elegir foto"
          }
          icon="upload"
          variant="secondary"
          disabled={disabled || busy}
          onPress={() => void choose()}
        />
        {busy ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Button
            title={linkMode ? "Ocultar enlace" : "Usar un enlace"}
            variant="quiet"
            disabled={disabled}
            onPress={() => setLinkMode(!linkMode)}
          />
        )}
      </View>
      <Text
        accessibilityLiveRegion="polite"
        style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}
      >
        {busy
          ? "Esperá a que termine la carga antes de enviar."
          : managedPhoto(value)
            ? "Foto lista. Se guardará al enviar el formulario."
            : "Elegí una foto JPG, PNG o WebP de hasta 10 MB. La optimizamos automáticamente."}
      </Text>
      {linkMode && (
        <>
          <Field
            label="Enlace HTTPS de la foto"
            value={value}
            onChangeText={(next) => {
              setPreview("");
              onChange(next);
            }}
            keyboardType="url"
            maxLength={2048}
            editable={!disabled && !busy}
          />
          <Button
            title="Ver vista previa"
            variant="quiet"
            disabled={disabled || busy || !/^https:\/\//.test(value)}
            onPress={() => setPreview(value.trim())}
          />
        </>
      )}
      {!!(failure || (!busy && error)) && (
        <Text
          accessibilityRole="alert"
          style={{ color: colors.error, fontSize: 13 }}
        >
          {failure || error}
        </Text>
      )}
    </View>
  );
}
