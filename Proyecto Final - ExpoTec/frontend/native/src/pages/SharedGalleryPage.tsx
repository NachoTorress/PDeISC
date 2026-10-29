/**
 * Pantalla del sistema compartido (datos de la API). Galería de la ExpoTec: fotos aprobadas, mis aportes y moderación (administración).
 */
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  Button,
  Card,
  Chip,
  Choice,
  PageHeading,
  Screen,
  RefreshButton,
  ActionRow,
} from "../components/ui";
import GalleryImage from "../components/GalleryImage";
import GallerySubmissionForm from "../components/GallerySubmissionForm";
import GalleryReviewForm from "../components/GalleryReviewForm";
import ContentGrid from "../components/ContentGrid";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { AuthError } from "../lib/authTypes";
import { galleryStatusLabel } from "../lib/gallery";
import type { GalleryPhoto } from "../lib/gallery";
import { formatDate } from "../lib/format";

type Form =
  | { actorId: string; type: "submit" }
  | { actorId: string; type: "review"; photo: GalleryPhoto };
/** Vista pública, propia o de moderación según la cuenta. */
export default function SharedGalleryPage({
  onAccount,
}: {
  onAccount: () => void;
}) {
  const { client, user, ready } = useAuth();
  const { colors } = useTheme();
  const [mode, setMode] = useState("public");
  const [status, setStatus] = useState("pending");
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [loadedScope, setLoadedScope] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const canModerate = ready && !!user?.roles.includes("admin");
  const effectiveMode =
    !ready || !user || (mode === "admin" && !canModerate) ? "public" : mode;
  const scope =
    effectiveMode === "public"
      ? "public"
      : `${user?.id}:${effectiveMode}:${status}`;
  const revision = useRef(0);
  /** Carga `POST /api/gallery/public/query`, `/mine/query` o `/moderation/query` paginado. */
  const load = useCallback(
    async (offset = 0) => {
      const request = ++revision.current;
      setLoading(true);
      setError("");
      try {
        const body = {
          limit: 20,
          offset,
          ...(effectiveMode === "admin" ? { status } : {}),
        };
        const result =
          effectiveMode === "public"
            ? await client.query<{ photos: GalleryPhoto[] }>(
                "/api/gallery/public/query",
                body,
              )
            : await client.send<{ photos: GalleryPhoto[] }>(
                `/api/gallery/${effectiveMode === "admin" ? "moderation" : "mine"}/query`,
                body,
              );
        if (request !== revision.current) return;
        setPhotos((current) =>
          offset
            ? [
                ...current,
                ...result.photos.filter(
                  (photo) =>
                    !current.some((previous) => previous.id === photo.id),
                ),
              ]
            : result.photos,
        );
        setLoadedScope(scope);
        setHasMore(result.photos.length === 20);
        setNextOffset(offset + result.photos.length);
      } catch (cause) {
        if (request !== revision.current) return;
        setPhotos([]);
        setLoadedScope("");
        setError(
          cause instanceof Error
            ? cause.message
            : "No pudimos cargar la galería.",
        );
        if (cause instanceof AuthError && cause.status === 403)
          void client.verify().catch(() => {});
      } finally {
        if (request === revision.current) setLoading(false);
      }
    },
    [client, effectiveMode, status, scope],
  );
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        revision.current++;
      };
    }, [load]),
  );
  const visible = loadedScope === scope ? photos : [];
  const currentForm =
    ready &&
    user?.id === form?.actorId &&
    (form?.type === "submit" || canModerate)
      ? form
      : null;
  const paragraph = { color: colors.muted, fontSize: 15, lineHeight: 22 };
  return (
    <Screen>
      <PageHeading
        icon="gallery"
        tone="accent"
        title="Galería de la ExpoTec"
        subtitle="La exposición, desde tu mirada."
      />
      {!!notice && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ ...paragraph, color: colors.success }}
        >
          {notice}
        </Text>
      )}
      {currentForm?.type === "submit" ? (
        <GallerySubmissionForm
          key={currentForm.actorId}
          onClose={() => {
            setForm(null);
            void load();
          }}
          onSubmitted={() => {
            setForm(null);
            setNotice(
              "Tu foto quedó pendiente. La organización la revisará antes de publicarla.",
            );
            if (mode === "mine") void load();
            else setMode("mine");
          }}
        />
      ) : currentForm?.type === "review" ? (
        <GalleryReviewForm
          key={`${currentForm.actorId}:${currentForm.photo.id}:${currentForm.photo.version}`}
          photo={currentForm.photo}
          onClose={() => {
            setForm(null);
            void load();
          }}
          onReviewed={() => {
            setForm(null);
            setNotice(
              "La decisión quedó guardada y el autor podrá consultarla.",
            );
            void load();
          }}
        />
      ) : (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Button
              title={
                user && ready ? "Compartir una foto" : "Ingresar para compartir"
              }
              icon="gallery"
              onPress={() => {
                setNotice("");
                if (user && ready)
                  setForm({ type: "submit", actorId: user.id });
                else onAccount();
              }}
            />
            <RefreshButton
              label="Actualizar galería"
              loading={loading}
              disabled={loading}
              onPress={() => void load()}
            />
          </View>
          <Choice
            label="Ver fotos"
            value={effectiveMode}
            onChange={(value) => {
              setMode(value);
              setNotice("");
            }}
            options={[
              { value: "public", label: "Fotos publicadas" },
              ...(user && ready ? [{ value: "mine", label: "Mis fotos" }] : []),
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
          {!!error && (
            <Text
              accessibilityRole="alert"
              style={{ ...paragraph, color: colors.error }}
            >
              {error}
            </Text>
          )}
          {loading && <ActivityIndicator color={colors.primary} />}
          {!loading && !error && !visible.length && (
            <Card>
              <Text style={paragraph}>
                {effectiveMode === "public"
                  ? "Todavía no hay fotos publicadas. ¡Compartí el primer recuerdo de la ExpoTec!"
                  : effectiveMode === "mine"
                    ? "Todavía no enviaste fotos. Tus aportes y sus estados aparecerán acá."
                    : "No hay fotos con este estado de revisión."}
              </Text>
            </Card>
          )}
          <ContentGrid minItemWidth={280}>
            {visible.map((photo) => (
              <Card key={`${scope}:${photo.id}`} style={{ flex: 1 }}>
                <GalleryImage
                  key={photo.imageUrl}
                  uri={photo.imageUrl}
                  caption={photo.caption}
                  height={220}
                  bounded
                />
                <Text
                  style={{ color: colors.text, fontSize: 16, lineHeight: 23 }}
                >
                  {photo.caption}
                </Text>
                <Text style={paragraph}>
                  {photo.authorName} · {formatDate(photo.createdAt)}
                </Text>
                {effectiveMode !== "public" && photo.status && (
                  <Chip
                    label={galleryStatusLabel[photo.status]}
                    tone={
                      photo.status === "approved"
                        ? "success"
                        : photo.status === "pending"
                          ? "warning"
                          : "neutral"
                    }
                  />
                )}
                {effectiveMode !== "public" && !!photo.reviewNote && (
                  <Text style={paragraph}>
                    Mensaje de organización: {photo.reviewNote}
                  </Text>
                )}
                {effectiveMode === "admin" && user && (
                  <ActionRow footer>
                    <Button
                      title="Revisar foto"
                      variant="secondary"
                      disabled={loading}
                      onPress={() => {
                        setNotice("");
                        setForm({ type: "review", actorId: user.id, photo });
                      }}
                    />
                  </ActionRow>
                )}
              </Card>
            ))}
          </ContentGrid>
          {hasMore && loadedScope === scope && !error && (
            <Button
              title="Cargar más fotos"
              variant="secondary"
              disabled={loading}
              onPress={() => void load(nextOffset)}
            />
          )}
        </>
      )}
    </Screen>
  );
}
