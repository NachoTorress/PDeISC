import { useState } from "react";
import { Text, View } from "react-native";
import {
  Button,
  Card,
  Chip,
  Choice,
  Field,
  Heading,
  PageHeading,
  ActionRow,
  InlineConfirm,
  Screen,
} from "../components/ui";
import ContentGrid from "../components/ContentGrid";
import DemoGalleryImage from "../components/DemoGalleryImage";
import DemoGallerySubmissionForm from "../components/DemoGallerySubmissionForm";
import { useDemo } from "../hooks/useDemo";
import { useTheme } from "../contexts/ThemeContext";
import { demoGalleryPhotos } from "../lib/demoGallery";
import { galleryStatusLabel } from "../lib/gallery";
import { formatDate } from "../lib/format";
import type { Role } from "../lib/types";

export default function DemoGalleryPage() {
  const { state, role, mutate, notify } = useDemo();
  const { colors } = useTheme();
  const [mode, setMode] = useState("public");
  const [status, setStatus] = useState("pending");
  const [form, setForm] = useState<{ role: Role; photoId?: string } | null>(
    null,
  );
  const [decision, setDecision] = useState("approved");
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const canModerate = role === "admin";
  const effectiveMode = mode === "admin" && !canModerate ? "public" : mode;
  const photos = demoGalleryPhotos(state);
  const visible = photos.filter((photo) =>
    effectiveMode === "public"
      ? photo.status === "approved"
      : effectiveMode === "mine"
        ? photo.authorRole === role
        : status === "all" || photo.status === status,
  );
  const activeForm = form?.role === role ? form : null;
  const reviewing =
    activeForm?.photoId && canModerate
      ? photos.find((photo) => photo.id === activeForm.photoId)
      : null;
  const noteError =
    decision === "rejected" && note.trim().length < 10
      ? "Indicá un motivo de al menos 10 caracteres."
      : "";
  function review() {
    if (!reviewing || noteError) return;
    const failure = mutate({
      type: "reviewGalleryPhoto",
      id: reviewing.id,
      decision: decision as "approved" | "rejected",
      note,
    });
    if (failure) {
      setError(failure);
      setConfirm(false);
    } else {
      setForm(null);
      notify("La decisión quedó guardada. El autor podrá verla en Mis fotos.");
    }
  }
  const paragraph = { color: colors.muted, fontSize: 14, lineHeight: 21 };
  return (
    <Screen>
      <PageHeading
        icon="gallery"
        tone="accent"
        title="Galería de la ExpoTec"
        subtitle="La exposición, desde tu mirada."
      />
      <Text style={paragraph}>
        Demostración con fotos de ejemplo. Podés enviar una foto, cambiar al
        perfil Organización para revisarla y volver a consultar el resultado.
      </Text>
      {activeForm && !activeForm.photoId ? (
        <DemoGallerySubmissionForm
          key={role}
          onClose={() => setForm(null)}
          onSubmitted={() => {
            setForm(null);
            setMode("mine");
            notify("Tu foto quedó pendiente de aprobación en la demostración.");
          }}
        />
      ) : reviewing ? (
        <Card style={{ width: "100%", maxWidth: 680, alignSelf: "center" }}>
          <Heading title="Revisar foto" subtitle={reviewing.authorName} />
          <DemoGalleryImage
            uri={reviewing.imageUrl}
            caption={reviewing.caption}
          />
          <Text style={{ color: colors.text, lineHeight: 22 }}>
            {reviewing.caption}
          </Text>
          <Choice
            label="Decisión"
            value={decision}
            onChange={(value) => {
              setDecision(value);
              setError("");
            }}
            disabled={confirm}
            options={[
              ...(reviewing.status === "approved"
                ? []
                : [{ value: "approved", label: "Publicar foto" }]),
              ...(reviewing.status === "rejected"
                ? []
                : [
                    {
                      value: "rejected",
                      label:
                        reviewing.status === "approved"
                          ? "Retirar de la galería"
                          : "Rechazar foto",
                    },
                  ]),
            ]}
          />
          <Field
            label="Mensaje para el autor"
            value={note}
            onChangeText={setNote}
            maxLength={1000}
            editable={!confirm}
            hint="Es obligatorio al rechazar o retirar la foto."
            error={noteError}
          />
          {!!error && (
            <Text accessibilityRole="alert" style={{ color: colors.error }}>
              {error}
            </Text>
          )}
          {confirm ? (
            <InlineConfirm
              tone={decision === "approved" ? "success" : "danger"}
              text={
                decision === "approved"
                  ? "¿Publicar esta foto en la galería de demostración?"
                  : "¿Dejar la foto fuera de la galería de demostración y guardar el motivo?"
              }
              confirmLabel="Confirmar decisión"
              onCancel={() => setConfirm(false)}
              onConfirm={review}
            />
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <Button
                title="Revisar decisión"
                disabled={!!noteError}
                onPress={() => setConfirm(true)}
              />
              <Button
                title="Volver a la lista"
                variant="quiet"
                onPress={() => setForm(null)}
              />
            </View>
          )}
        </Card>
      ) : (
        <>
          <Button
            title="¡Subí tu foto de la ExpoTec!"
            icon="gallery"
            onPress={() => setForm({ role })}
          />
          <Choice
            label="Ver fotos"
            value={effectiveMode}
            onChange={setMode}
            options={[
              { value: "public", label: "Fotos publicadas" },
              { value: "mine", label: "Mis fotos" },
              ...(canModerate
                ? [{ value: "admin", label: "Moderar fotos" }]
                : []),
            ]}
          />
          {effectiveMode === "admin" && (
            <Choice
              label="Estado de revisión"
              value={status}
              onChange={setStatus}
              options={[
                { value: "pending", label: "Pendientes" },
                { value: "approved", label: "Publicadas" },
                { value: "rejected", label: "No publicadas" },
                { value: "all", label: "Todas" },
              ]}
            />
          )}
          {!visible.length && (
            <Card>
              <Text style={paragraph}>
                {effectiveMode === "public"
                  ? "Todavía no hay fotos publicadas."
                  : effectiveMode === "mine"
                    ? "Tus aportes y sus estados aparecerán acá."
                    : "No hay fotos con este estado de revisión."}
              </Text>
            </Card>
          )}
          <ContentGrid minItemWidth={280}>
            {visible.map((photo) => (
              <Card key={photo.id} style={{ flex: 1 }}>
                <DemoGalleryImage
                  uri={photo.imageUrl}
                  caption={photo.caption}
                />
                <Text
                  style={{ color: colors.text, fontSize: 16, lineHeight: 23 }}
                >
                  {photo.caption}
                </Text>
                <Text style={paragraph}>
                  {photo.authorName} · {formatDate(photo.createdAt)}
                </Text>
                {effectiveMode !== "public" && (
                  <Chip
                    label={galleryStatusLabel[photo.status]}
                    tone={
                      photo.status === "approved"
                        ? "success"
                        : photo.status === "pending"
                          ? "warning"
                          : "error"
                    }
                  />
                )}
                {effectiveMode !== "public" && !!photo.reviewNote && (
                  <Text style={paragraph}>
                    Mensaje de organización: {photo.reviewNote}
                  </Text>
                )}
                {effectiveMode === "admin" && (
                  <ActionRow footer>
                    <Button
                      title={
                        photo.status === "approved"
                          ? "Retirar foto"
                          : "Revisar foto"
                      }
                      variant="secondary"
                      onPress={() => {
                        setForm({ role, photoId: photo.id });
                        setDecision(
                          photo.status === "approved" ? "rejected" : "approved",
                        );
                        setNote("");
                        setError("");
                        setConfirm(false);
                      }}
                    />
                  </ActionRow>
                )}
              </Card>
            ))}
          </ContentGrid>
        </>
      )}
    </Screen>
  );
}
