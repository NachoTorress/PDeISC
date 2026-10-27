/**
 * Campo para elegir y subir una foto (proyecto o galería), con progreso, cancelación y alternativa por enlace.
 */
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

/** Selector de foto conectado a la carga de la API. */
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
  const [preparing, setPreparing] = useState(false);
  const [failure, setFailure] = useState(""),
    [linkMode, setLinkMode] = useState(Boolean(value && !managedPhoto(value)));
  const [preview, setPreview] = useState("");
  const controller = useRef<AbortController | null>(null);
  const selecting = useRef(false),
    mounted = useRef(true);
  const retryAsset = useRef<ImagePicker.ImagePickerAsset | null>(null);
  const busyCallback = useRef(onBusyChange);
  busyCallback.current = onBusyChange;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
      busyCallback.current(false);
    };
  }, []);
  /** Prepara y sube la foto mostrando el progreso. */
  async function upload(asset: ImagePicker.ImagePickerAsset) {
    if (disabled || controller.current || !mounted.current) return;
    const abort = new AbortController();
    controller.current = abort;
    retryAsset.current = asset;
    setBusy(true);
    onBusyChange(true);
    setPreparing(true);
    setPercent(0);
    setFailure("");
    setPreview(asset.uri);
    try {
      const photo = await preparePhoto(asset);
      if (mounted.current) setPreparing(false);
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
      retryAsset.current = null;
      setLinkMode(false);
      setPreview("");
    } catch (cause) {
      if (mounted.current && !abort.signal.aborted) {
        setFailure(
          cause instanceof Error
            ? cause.message
            : "No pudimos subir la foto. Probá nuevamente.",
        );
        setPreview("");
      }
    } finally {
      if (controller.current === abort) controller.current = null;
      if (mounted.current) {
        setBusy(false);
        setPreparing(false);
        onBusyChange(false);
      }
    }
  }
  /** Pide permiso y abre la galería del dispositivo. */
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
      const asset = picked.assets[0];
      if (!asset) throw new Error("No recibimos la foto seleccionada. Elegila nuevamente.");
      await upload(asset);
    } catch {
      if (mounted.current) setFailure("No pudimos abrir la galería. Volvé a elegir la foto.");
    } finally {
      selecting.current = false;
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
              ? preparing
                ? "Optimizando foto…"
                : percent >= 90
                  ? "Guardando foto…"
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
          <>
            <ActivityIndicator color={colors.primary} />
            <Button
              title="Cancelar carga"
              variant="quiet"
              onPress={() => {
                retryAsset.current = null;
                controller.current?.abort();
                setPreview("");
              }}
            />
          </>
        ) : (
          <Button
            title={linkMode ? "Ocultar enlace" : "Usar un enlace"}
            variant="quiet"
            disabled={disabled}
            onPress={() => setLinkMode(!linkMode)}
          />
        )}
      </View>
      {!busy && !!failure && !!retryAsset.current && (
        <Button
          title="Reintentar carga"
          variant="secondary"
          disabled={disabled}
          onPress={() => {
            if (retryAsset.current) void upload(retryAsset.current);
          }}
        />
      )}
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
