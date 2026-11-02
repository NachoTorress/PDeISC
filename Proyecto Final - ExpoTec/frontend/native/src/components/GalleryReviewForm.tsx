/** Formulario de moderación de una foto: publicar, retirar o eliminar. */
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

/** Envía la revisión con PATCH o la eliminación con DELETE. */
export default function GalleryReviewForm({
  photo,
  deletePhoto = false,
  onClose,
  onReviewed,
}: {
  photo: GalleryPhoto;
  deletePhoto?: boolean;
  onClose: () => void;
  onReviewed: (deleted: boolean) => void;
}) {
  const { client } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const initialDecision = deletePhoto
    ? "delete"
    : photo.status === "approved"
      ? "rejected"
      : "approved";
  const [decision, setDecision] = useState(initialDecision);
  const deleting = decision === "delete";
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [confirm, setConfirm] = useState<"save" | "close" | null>(null);
  const [leave, setLeave] = useState<NavigationAction | null>(null);
  const working = useRef(false);
  const dirty = !!note || decision !== initialDecision;
  const noteError =
    decision === "rejected" && note.trim().length < 10
      ? "Indicá un motivo de al menos 10 caracteres."
      : "";
  usePreventRemove((dirty || busy) && !saved, ({ data }) =>
    setLeave(data.action),
  );
  /** Cierra el formulario si no hay un envío en curso. */
  function close() {
    if (working.current) return;
    setSaved(true);
    if (leave) navigation.dispatch(leave);
    else onClose();
  }
  /** Valida el motivo y envía la decisión. */
  async function review() {
    if (working.current || noteError || !photo.version) return;
    working.current = true;
    setBusy(true);
    setConfirm(null);
    setError("");
    try {
      await client.send(
        `/api/gallery/${photo.id}`,
        deleting
          ? { version: photo.version }
          : { version: photo.version, decision, note: note.trim() },
        deleting ? "DELETE" : "PATCH",
      );
      setSaved(true);
      onReviewed(deleting);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos guardar la acción sobre la foto.",
      );
      if (cause instanceof AuthError) {
        if (cause.status === 409 || cause.status === 404) setConflict(true);
        if (cause.status === 403) void client.verify().catch(() => {});
      }
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  return (
    <Card style={{ width: "100%", maxWidth: 680, alignSelf: "center" }}>
      <Heading
        title={deleting ? "Eliminar foto" : "Revisar foto"}
        subtitle={photo.authorName}
      />
      <GalleryImage
        key={photo.imageUrl}
        uri={photo.imageUrl}
        caption={photo.caption}
      />
      <Text style={{ color: colors.text, lineHeight: 22 }}>
        {photo.caption}
      </Text>
      <Choice
        label="Decisión"
        value={decision}
        onChange={setDecision}
        disabled={busy || !!confirm || !!leave || conflict}
        options={[
          ...(photo.status === "approved"
            ? []
            : [{ value: "approved", label: "Publicar foto" }]),
          ...(photo.status === "rejected"
            ? []
            : [
                {
                  value: "rejected",
                  label:
                    photo.status === "approved"
                      ? "Retirar de la galería"
                      : "Rechazar foto",
                },
              ]),
          { value: "delete", label: "Eliminar definitivamente" },
        ]}
      />
      {!deleting && (
        <Field
          label="Mensaje para el autor"
          value={note}
          onChangeText={setNote}
          maxLength={1000}
          editable={!busy && !confirm && !leave}
          hint="El autor podrá leer el mensaje. Es obligatorio al rechazar o retirar."
          error={noteError}
        />
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={{ color: colors.error }}>
          {error}
        </Text>
      )}
      {confirm === "save" ? (
        <InlineConfirm
          tone={decision === "approved" ? "success" : "danger"}
          text={
            deleting
              ? "¿Eliminar definitivamente esta foto y sus revisiones? Desaparecerá de la galería y de Mis fotos. Esta acción no se puede deshacer."
              : decision === "approved"
                ? "¿Publicar esta foto para todos los visitantes?"
                : "¿Dejar esta foto fuera de la galería pública y comunicar el motivo al autor?"
          }
          confirmLabel={deleting ? "Sí, eliminar foto" : "Confirmar decisión"}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void review()}
        />
      ) : confirm === "close" || leave ? (
        <InlineConfirm
          text="¿Descartar la revisión y actualizar la lista?"
          confirmLabel="Descartar y volver"
          onCancel={() => {
            setConfirm(null);
            setLeave(null);
          }}
          onConfirm={close}
        />
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {!conflict && (
            <Button
              title={
                busy
                  ? deleting
                    ? "Eliminando…"
                    : "Guardando…"
                  : deleting
                    ? "Eliminar foto"
                    : "Revisar decisión"
              }
              variant={deleting ? "danger" : "primary"}
              disabled={busy || !!noteError}
              onPress={() => setConfirm("save")}
            />
          )}
          <Button
            title={
              conflict
                ? "Descartar revisión y actualizar lista"
                : "Volver a la lista"
            }
            variant="quiet"
            disabled={busy}
            onPress={() =>
              dirty || conflict ? setConfirm("close") : onClose()
            }
          />
        </View>
      )}
    </Card>
  );
}
