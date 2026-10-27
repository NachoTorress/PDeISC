/**
 * Pantalla del sistema compartido (datos de la API REST). Presentación TV pública con los proyectos confirmados del servidor.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import {
  Button,
  Card,
  Choice,
  Heading,
  Screen,
  RefreshButton,
} from "../components/ui";
import { SharedPresentationCard } from "../components/SharedPresentationCard";
import { SharedPresentationVideo } from "../components/SharedPresentationVideo";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { usePresentationDisplay } from "../hooks/usePresentationDisplay";
import {
  loadPresentation,
  presentationMediaKey,
  presentationSelection,
} from "../lib/sharedPresentation";
import type { PresentationProject } from "../lib/sharedPresentation";

/** Secuencia automática con pausa, avance, retroceso y pantalla completa. */
export default function SharedPresentationPage({
  onBack,
  onProject,
}: {
  onBack: () => void;
  onProject: (id: string) => void;
}) {
  const { client } = useAuth(),
    { colors } = useTheme();
  const display = usePresentationDisplay(),
    focused = useIsFocused();
  const [projects, setProjects] = useState<PresentationProject[]>([]),
    [selected, setSelected] = useState("");
  const [playing, setPlaying] = useState(false),
    [muted, setMuted] = useState(true),
    [seconds, setSeconds] = useState("8");
  const [epoch, setEpoch] = useState(0),
    [failed, setFailed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [displayError, setDisplayError] = useState(""),
    [blocked, setBlocked] = useState(false),
    [updatedAt, setUpdatedAt] = useState("");
  const generation = useRef(0),
    pending = useRef(false);
  const project = projects.find((item) => item.id === selected) ?? projects[0];
  const mediaKey = project ? presentationMediaKey(project) : "";
  const videoFailed = failed.includes(mediaKey),
    hasVideo = !!project?.videoUrl && !videoFailed;
  const active = playing && focused && display.visible && !error;
  /** Carga todos los proyectos confirmados. */
  const load = useCallback(async () => {
    if (pending.current) return;
    const request = ++generation.current;
    pending.current = true;
    setLoading(true);
    try {
      const fresh = await loadPresentation(
        client.query,
        () => generation.current === request,
      );
      if (!fresh || request !== generation.current) return;
      setProjects(fresh);
      setSelected((current) => presentationSelection(fresh, current));
      setFailed((current) =>
        current.filter((key) =>
          fresh.some((item) => presentationMediaKey(item) === key),
        ),
      );
      setUpdatedAt(
        new Date().toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      setError("");
      if (!fresh.length) setPlaying(false);
    } catch (cause) {
      if (request !== generation.current) return;
      setPlaying(false);
      setProjects([]);
      setSelected("");
      setError(
        `La presentación se pausó porque no pudimos actualizar la muestra. ${cause instanceof Error ? cause.message : "Volvé a intentar."}`,
      );
    } finally {
      if (request === generation.current) {
        pending.current = false;
        setLoading(false);
      }
    }
  }, [client]);
  useFocusEffect(
    useCallback(() => {
      if (!display.visible) return;
      void load();
      const timer = setInterval(() => {
        void load();
      }, 60000);
      return () => {
        generation.current++;
        pending.current = false;
        clearInterval(timer);
      };
    }, [load, display.visible]),
  );
  useEffect(() => {
    if (!focused || !display.visible) setPlaying(false);
  }, [focused, display.visible]);
  /** Pasa a la ficha siguiente o anterior. */
  const advance = useCallback(
    (direction = 1) => {
      setSelected((current) =>
        presentationSelection(projects, current, direction),
      );
      setEpoch((current) => current + 1);
      setBlocked(false);
    },
    [projects],
  );
  const next = useCallback(() => advance(1), [advance]);
  const fail = useCallback(() => {
    setFailed((current) =>
      current.includes(mediaKey) ? current : [...current, mediaKey],
    );
    setBlocked(false);
  }, [mediaKey]);
  const block = useCallback(() => {
    setPlaying(false);
    setBlocked(true);
  }, []);
  useEffect(() => {
    if (!active || !project || hasVideo) return;
    const timer = setTimeout(next, Number(seconds) * 1000);
    return () => clearTimeout(timer);
  }, [active, project?.id, hasVideo, epoch, seconds, next]);
  const paragraph = { color: colors.muted, lineHeight: 22 };
  return (
    <View ref={display.ref} style={{ flex: 1, backgroundColor: colors.page }}>
      <Screen>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <Button
            title="Volver a proyectos"
            icon="arrowLeft"
            variant="quiet"
            onPress={() => {
              setPlaying(false);
              void display
                .exit()
                .catch(() => {})
                .then(onBack);
            }}
          />
          <Text style={{ color: colors.text }}>
            Muestra pública ·{" "}
            {project
              ? projects.findIndex((item) => item.id === project.id) + 1
              : 0}{" "}
            / {projects.length}
          </Text>
          <RefreshButton
            label="Actualizar muestra"
            loading={loading}
            disabled={loading}
            onPress={() => {
              void load();
            }}
          />
          {display.supported && (
            <Button
              title={
                display.fullscreen
                  ? "Salir de pantalla completa"
                  : "Pantalla completa"
              }
              icon="tv"
              variant="secondary"
              onPress={() => {
                setDisplayError("");
                void display
                  .toggle()
                  .catch(() =>
                    setDisplayError(
                      "No pudimos cambiar a pantalla completa. Podés continuar en esta ventana.",
                    ),
                  );
              }}
            />
          )}
        </View>
        {!!error && (
          <Text
            accessibilityRole="alert"
            style={{ color: colors.error, lineHeight: 22 }}
          >
            {error}
          </Text>
        )}
        {!!displayError && (
          <Text
            accessibilityRole="alert"
            style={{ color: colors.error, lineHeight: 22 }}
          >
            {displayError}
          </Text>
        )}
        {blocked && (
          <Card>
            <Text style={paragraph}>
              El navegador no permitió reproducir el video con sonido. Podés
              iniciar de nuevo o continuar sin sonido.
            </Text>
            <Button
              title="Continuar sin sonido"
              onPress={() => {
                setMuted(true);
                setBlocked(false);
                setPlaying(true);
              }}
            />
          </Card>
        )}
        {project ? (
          <SharedPresentationCard
            project={project}
            videoFailed={videoFailed}
            video={
              hasVideo ? (
                <SharedPresentationVideo
                  key={`${mediaKey}:${epoch}`}
                  uri={project.videoUrl}
                  playing={!!active}
                  muted={muted}
                  onEnd={next}
                  onError={fail}
                  onBlocked={block}
                />
              ) : undefined
            }
          />
        ) : loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : !error ? (
          <Card>
            <Heading
              title="Todavía no hay proyectos confirmados"
              subtitle="La presentación se completa cuando se confirman los proyectos de la exposición."
            />
          </Card>
        ) : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <Button
            title="Anterior"
            icon="arrowLeft"
            variant="secondary"
            disabled={!project || !!error}
            onPress={() => advance(-1)}
          />
          <Button
            title={playing ? "Pausar presentación" : "Iniciar presentación"}
            icon={playing ? "pause" : "play"}
            disabled={!project || !!error}
            onPress={() => {
              setBlocked(false);
              setPlaying((current) => !current);
            }}
          />
          <Button
            title="Siguiente"
            icon="arrowRight"
            variant="secondary"
            disabled={!project || !!error}
            onPress={next}
          />
          <Button
            title={muted ? "Activar sonido" : "Silenciar videos"}
            variant="secondary"
            disabled={!project}
            onPress={() => setMuted((current) => !current)}
          />
          {project && (
            <Button
              title="Ver ficha completa del proyecto"
              variant="quiet"
              onPress={() => {
                setPlaying(false);
                void display
                  .exit()
                  .catch(() => {})
                  .then(() => onProject(project.id));
              }}
            />
          )}
          {project && videoFailed && (
            <Button
              title="Reintentar video"
              variant="secondary"
              onPress={() => {
                setFailed((current) =>
                  current.filter((key) => key !== mediaKey),
                );
                setEpoch((current) => current + 1);
              }}
            />
          )}
        </View>
        <Choice
          label="Tiempo de cada ficha"
          value={seconds}
          options={["8", "15", "30"].map((value) => ({
            value,
            label: `${value} segundos`,
          }))}
          onChange={setSeconds}
        />
        <Text style={paragraph}>
          {playing ? "Presentación en curso." : "Presentación pausada."} Las
          fichas avanzan cada {seconds} segundos y los videos al terminar. La
          muestra se actualiza cada minuto; si falla la conexión, se pausa hasta
          recuperar los proyectos.
        </Text>
        {!!updatedAt && (
          <Text style={paragraph}>Muestra actualizada a las {updatedAt}.</Text>
        )}
      </Screen>
    </View>
  );
}
