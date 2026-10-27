/** Formulario de moderación de una foto: aprobar, rechazar o retirar con motivo. */
import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { useNavigation, usePreventRemove } from "@react-navigation/native";
import type { NavigationAction } from "@react-navigation/native";
import { Button, Card, Choice, Field, Heading, InlineConfirm } from "./ui";
import GalleryImage from "./GalleryImage";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { AuthError } from "../lib/authTypes";
import type { GalleryPhoto } from "../lib/gallery";

/** Envía la decisión con `PATCH /api/gallery/:id`. */
export default function GalleryReviewForm({ photo, onClose, onReviewed }: { photo: GalleryPhoto; onClose: () => void; onReviewed: () => void }) {
  const { client } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [decision, setDecision] = useState(photo.status === "approved" ? "rejected" : "approved");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [confirm, setConfirm] = useState<"save" | "close" | null>(null);
  const [leave, setLeave] = useState<NavigationAction | null>(null);
  const working = useRef(false);
  const dirty = !!note || decision !== (photo.status === "approved" ? "rejected" : "approved");
  const noteError = decision === "rejected" && note.trim().length < 10 ? "Indicá un motivo de al menos 10 caracteres." : "";
  usePreventRemove((dirty || busy) && !saved, ({ data }) => setLeave(data.action));
  /** Cierra el formulario si no hay un envío en curso. */
  function close() {
    if (working.current) return;
    setSaved(true);
    if (leave) navigation.dispatch(leave); else onClose();
  }
  /** Valida el motivo y envía la decisión. */
  async function review() {
    if (working.current || noteError || !photo.version) return;
    working.current = true;
    setBusy(true);
    setConfirm(null);
    setError("");
    try {
      await client.send(`/api/gallery/${photo.id}`, { version: photo.version, decision, note: note.trim() }, "PATCH");
      setSaved(true);
      onReviewed();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos revisar la foto.");
      if (cause instanceof AuthError) {
        if (cause.status === 409) setConflict(true);
        if (cause.status === 403) void client.verify().catch(() => {});
      }
    } finally { working.current = false; setBusy(false); }
  }
  return (
    <Card style={{ width: "100%", maxWidth: 680, alignSelf: "center" }}>
      <Heading title="Revisar foto" subtitle={photo.authorName} />
      <GalleryImage key={photo.imageUrl} uri={photo.imageUrl} caption={photo.caption} />
      <Text style={{ color: colors.text, lineHeight: 22 }}>{photo.caption}</Text>
      <Choice label="Decisión" value={decision} onChange={setDecision} disabled={busy || !!confirm || !!leave || conflict}
        options={[...(photo.status === "approved" ? [] : [{ value: "approved", label: "Publicar foto" }]), ...(photo.status === "rejected" ? [] : [{ value: "rejected", label: photo.status === "approved" ? "Retirar de la galería" : "Rechazar foto" }])]} />
      <Field label="Mensaje para el autor" value={note} onChangeText={setNote} maxLength={1000} editable={!busy && !confirm && !leave}
        hint="El autor podrá leer el mensaje. Es obligatorio al rechazar o retirar." error={noteError} />
      {!!error && <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text>}
      {confirm === "save" ? <InlineConfirm tone={decision === "approved" ? "success" : "danger"} text={decision === "approved" ? "¿Publicar esta foto para todos los visitantes?" : "¿Dejar esta foto fuera de la galería pública y comunicar el motivo al autor?"}
        confirmLabel="Confirmar decisión" onCancel={() => setConfirm(null)} onConfirm={() => void review()} /> : confirm === "close" || leave ? (
          <InlineConfirm text="¿Descartar la revisión y actualizar la lista?" confirmLabel="Descartar y volver" onCancel={() => { setConfirm(null); setLeave(null); }} onConfirm={close} />
        ) : <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {!conflict && <Button title={busy ? "Guardando…" : "Revisar decisión"} disabled={busy || !!noteError} onPress={() => setConfirm("save")} />}
          <Button title={conflict ? "Descartar revisión y actualizar lista" : "Volver a la lista"} variant="quiet" disabled={busy} onPress={() => dirty || conflict ? setConfirm("close") : onClose()} />
        </View>}
    </Card>
  );
}
