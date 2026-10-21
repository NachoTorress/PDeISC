import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { useNavigation, usePreventRemove } from "@react-navigation/native";
import type { NavigationAction } from "@react-navigation/native";
import { Button, Card, Field, Heading, InlineConfirm } from "./ui";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { AuthError } from "../lib/authTypes";
import { galleryPhotoErrors } from "../lib/gallery";
import GalleryImage from "./GalleryImage";

export default function GallerySubmissionForm({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) {
  const { client } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [input, setInput] = useState({ imageUrl: "", caption: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fields, setFields] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [leave, setLeave] = useState<NavigationAction | null>(null);
  const working = useRef(false);
  const dirty = !!(input.imageUrl || input.caption);
  const validation = galleryPhotoErrors(input);
  usePreventRemove((dirty || busy) && !saved, ({ data }) => setLeave(data.action));
  function update(key: keyof typeof input, value: string) {
    setInput(current => ({ ...current, [key]: value }));
    setTouched(current => ({ ...current, [key]: true }));
    setFields(current => ({ ...current, [key]: "" }));
    if (key === "imageUrl") setPreview("");
    setError("");
  }
  async function submit() {
    setTouched({ imageUrl: true, caption: true });
    if (working.current || Object.keys(validation).length) return;
    working.current = true;
    setBusy(true);
    setError("");
    try {
      await client.send("/api/gallery/submit", { imageUrl: input.imageUrl.trim(), caption: input.caption.trim().normalize("NFC") });
      setSaved(true);
      onSubmitted();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos enviar la foto.");
      if (cause instanceof AuthError) setFields(cause.fields);
    } finally { working.current = false; setBusy(false); }
  }
  return (
    <Card style={{ width: "100%", maxWidth: 680, alignSelf: "center" }}>
      <Heading title="¡Subí tu foto de la ExpoTec!" subtitle="Compartí un recuerdo. Organización lo revisará antes de publicarlo." />
      <Field label="Enlace HTTPS de la foto" value={input.imageUrl} onChangeText={value => update("imageUrl", value)}
        keyboardType="url" maxLength={2048} editable={!busy}
        hint="Usá un enlace directo a una imagen ya alojada, accesible sin iniciar sesión."
        error={fields.imageUrl || (touched.imageUrl ? validation.imageUrl : undefined)} />
      <Field label="Contanos qué muestra la foto" value={input.caption} onChangeText={value => update("caption", value)} maxLength={400} editable={!busy}
        hint={`${input.caption.length}/400 caracteres. Se publicarán tu nombre y la descripción si se aprueba.`}
        error={fields.caption || (touched.caption ? validation.caption : undefined)} />
      <Button title="Ver vista previa" variant="secondary" disabled={busy || !!validation.imageUrl} onPress={() => setPreview(input.imageUrl.trim())} />
      {!!preview && <GalleryImage key={preview} uri={preview} caption={input.caption || "Vista previa de tu foto"} />}
      {!!error && <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text>}
      {cancel || leave ? <InlineConfirm text="¿Descartar el aporte sin enviarlo?" confirmLabel="Descartar aporte"
        onCancel={() => { setCancel(false); setLeave(null); }} onConfirm={() => {
          if (working.current) return;
          setSaved(true);
          if (leave) navigation.dispatch(leave); else onClose();
        }} /> : <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Button title={busy ? "Enviando…" : "Enviar para aprobación"} disabled={busy} onPress={() => void submit()} />
          <Button title="Cancelar aporte" variant="quiet" disabled={busy} onPress={() => dirty ? setCancel(true) : onClose()} />
        </View>}
    </Card>
  );
}
