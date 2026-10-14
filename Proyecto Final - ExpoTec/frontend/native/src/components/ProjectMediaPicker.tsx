import { useState } from "react";
import { Image, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../contexts/ThemeContext";
import { projectVideoError } from "./projectFormModel";
import { projectImageFromBase64 } from "./projectImage";
import { Button, Field, Section } from "./ui";

type Props = {
  image: string;
  video: string;
  editing: boolean;
  imageError?: string;
  submitAttempt: boolean;
  onImageChange: (value: string) => void;
  onVideoChange: (value: string) => void;
  onBusyChange: (busy: boolean) => void;
  onErrorChange: (error: string) => void;
};

/** Recibe una selección nativa, verifica formato y tamaño y entrega una imagen base64 persistible. */
export default function ProjectMediaPicker({
  image,
  video,
  editing,
  imageError,
  submitAttempt,
  onImageChange,
  onVideoChange,
  onBusyChange,
  onErrorChange,
}: Props) {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [pickerError, setPickerError] = useState("");
  const [videoTouched, setVideoTouched] = useState(false);
  const reportError = (message: string) => {
    setPickerError(message);
    onErrorChange(message);
  };
  const chooseImage = async () => {
    setBusy(true);
    onBusyChange(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        base64: true,
        quality: 1,
        allowsEditing: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const data = asset?.base64 ?? "";
      const validated = projectImageFromBase64(data);
      if (validated.error) {
        reportError(validated.error);
        return;
      }
      reportError("");
      onImageChange(validated.image);
    } catch {
      reportError(
        "No pudimos abrir la imagen. Revisá el acceso a tus fotos e intentá de nuevo.",
      );
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
  };
  return (
    <Section title="Cómo se verá">
      <Text style={{ color: colors.text, fontWeight: "600" }}>
        Imagen de referencia
      </Text>
      <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
        PNG, JPG o WebP. Hasta 2 MB.
        {editing ? " Podés reemplazar la imagen actual." : ""}
      </Text>
      {image ? (
        <Image
          source={{ uri: image }}
          accessibilityLabel="Vista previa de la imagen del proyecto"
          style={{ width: "100%", height: 190, borderRadius: 12 }}
          resizeMode="contain"
        />
      ) : null}
      <Button
        title={
          busy
            ? "Preparando imagen…"
            : image
              ? "Reemplazar imagen"
              : "Elegir imagen"
        }
        icon="image"
        variant="secondary"
        style={{ alignSelf: "flex-start" }}
        disabled={busy}
        onPress={() => {
          void chooseImage();
        }}
      />
      {!!(pickerError || imageError) && (
        <Text
          accessibilityRole="alert"
          style={{ color: colors.error, fontSize: 14, lineHeight: 21 }}
        >
          {pickerError || imageError}
        </Text>
      )}
      <Field
        label="Enlace al video explicativo (opcional)"
        value={video}
        keyboardType="url"
        maxLength={2048}
        onChangeText={(value) => {
          onVideoChange(value);
          setVideoTouched(true);
        }}
        error={videoTouched || submitAttempt ? projectVideoError(video) : ""}
        hint="Enlace completo a un archivo .mp4 o .webm. Los videos confirmados aparecen en el modo TV."
      />
    </Section>
  );
}
