/** Formulario para enviar una foto en la demostración (datos locales). */
import { useRef, useState } from "react";
import { Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../contexts/ThemeContext";
import { useDemo } from "../hooks/useDemo";
import { demoCaptionError, demoGalleryImageError } from "../lib/demoGallery";
import { projectImageFromBase64 } from "./projectImage";
import DemoGalleryImage from "./DemoGalleryImage";
import { Button, Card, Field, Heading, InlineConfirm } from "./ui";

/** Permite elegir una imagen o la de ejemplo y escribir la descripción. */
export default function DemoGallerySubmissionForm({
  onClose,
  onSubmitted,
}: {
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const { colors } = useTheme();
  const { mutate } = useDemo();
  const [image, setImage] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState("");
  const [cancel, setCancel] = useState(false);
  const selecting = useRef(false);
  /** Abre el selector de imágenes del dispositivo. */
  async function choose() {
    if (selecting.current) return;
    selecting.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        base64: true,
        quality: 0.8,
        allowsEditing: false,
      });
      if (result.canceled) return;
      const selected = projectImageFromBase64(result.assets[0]?.base64 ?? "");
      if (selected.error) setError(selected.error);
      else setImage(selected.image);
    } catch {
      setError("No pudimos abrir la foto. Probá nuevamente.");
    } finally {
      selecting.current = false;
      setBusy(false);
    }
  }
  /** Valida y guarda la foto en el estado local de la demo. */
  function submit() {
    setAttempted(true);
    if (busy || demoGalleryImageError(image, true) || demoCaptionError(caption))
      return;
    const failure = mutate({
      type: "submitGalleryPhoto",
      imageUrl: image,
      caption,
    });
    if (failure) setError(failure);
    else onSubmitted();
  }
  return (
    <Card style={{ width: "100%", maxWidth: 680, alignSelf: "center" }}>
      <Heading
        title="¡Subí tu foto de la ExpoTec!"
        subtitle="Probá el envío de una foto para que organización la revise."
      />
      {!!image && (
        <DemoGalleryImage uri={image} caption="Vista previa de tu aporte" />
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button
          title={
            busy ? "Preparando foto…" : image ? "Cambiar foto" : "Elegir foto"
          }
          icon="upload"
          variant="secondary"
          disabled={busy}
          onPress={() => void choose()}
        />
        <Button
          title="Usar foto de ejemplo"
          variant="quiet"
          disabled={busy}
          onPress={() => {
            setImage("sample:electronics");
            setError("");
          }}
        />
      </View>
      <Text style={{ color: colors.muted, lineHeight: 20 }}>
        PNG, JPG o WebP de hasta 2 MB. Este aporte se guarda en la demostración
        de este dispositivo.
      </Text>
      {attempted && !!demoGalleryImageError(image, true) && (
        <Text accessibilityRole="alert" style={{ color: colors.error }}>
          {demoGalleryImageError(image, true)}
        </Text>
      )}
      <Field
        label="Contanos qué muestra la foto"
        value={caption}
        onChangeText={setCaption}
        maxLength={400}
        editable={!busy}
        hint={`${caption.length}/400 caracteres. Organización revisará tu aporte antes de publicarlo.`}
        error={attempted ? demoCaptionError(caption) : ""}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={{ color: colors.error }}>
          {error}
        </Text>
      )}
      {cancel ? (
        <InlineConfirm
          text="¿Descartar el aporte sin enviarlo?"
          confirmLabel="Descartar aporte"
          onCancel={() => setCancel(false)}
          onConfirm={onClose}
        />
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Button
            title="Enviar para aprobación"
            disabled={busy}
            onPress={submit}
          />
          <Button
            title="Cancelar aporte"
            variant="quiet"
            disabled={busy}
            onPress={() => (image || caption ? setCancel(true) : onClose())}
          />
        </View>
      )}
    </Card>
  );
}
