/**
 * Pantalla del sistema compartido (datos de la API). Presentación TV pública con los proyectos confirmados del servidor.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { SharedPresentationCard } from "../components/SharedPresentationCard";
import { SharedPresentationVideo } from "../components/SharedPresentationVideo";
import { useAuth } from "../contexts/AuthContext";
import { PresentationViewer } from "../components/PresentationViewer";
import { PresentationSetup } from "../components/PresentationSetup";
import {
  usePresentationDisplay,
  usePresentationKeyboard,
} from "../hooks/usePresentationDisplay";
import {
  loadPresentation,
  presentationMediaKey,
  presentationSelection,
} from "../lib/sharedPresentation";
import type { PresentationProject } from "../lib/sharedPresentation";

/** Secuencia automática con pausa, avance, retroceso y pantalla completa. */
export default function SharedPresentationPage({
  onBack,
}: {
  onBack: () => void;
}) {
  const { client } = useAuth();
  const display = usePresentationDisplay(),
    focused = useIsFocused();
  const [projects, setProjects] = useState<PresentationProject[]>([]),
    [selected, setSelected] = useState("");
  const [presenting, setPresenting] = useState(false);
  const [playing, setPlaying] = useState(false),
    [muted, setMuted] = useState(true),
    [seconds, setSeconds] = useState("8");
  const [epoch, setEpoch] = useState(0),
    [failed, setFailed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [displayError, setDisplayError] = useState(""),
    [blocked, setBlocked] = useState(false);
  const generation = useRef(0),
    pending = useRef(false);
  const project = projects.find((item) => item.id === selected) ?? projects[0];
  const mediaKey = project ? presentationMediaKey(project) : "";
  const videoFailed = failed.includes(mediaKey),
    hasVideo = !!project?.videoUrl && !videoFailed;
  const active = presenting && playing && focused && display.visible && !error;
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
  const close = useCallback(() => {
    setPresenting(false);
    setPlaying(false);
    setBlocked(false);
    void display.exit().catch(() => {});
  }, [display.exit]);
  useEffect(() => {
    if (presenting && (!focused || !!error || (!loading && !project))) close();
  }, [presenting, focused, error, loading, project, close]);
  usePresentationKeyboard(presenting, {
    close,
    next,
    previous: () => advance(-1),
    toggle: () => setPlaying((value) => !value),
  });
  function start() {
    // La solicitud se hace en el clic para conservar la activación del navegador.
    void display
      .enter()
      .catch(() =>
        setDisplayError(
          "El navegador no permitió ocultar su barra. La muestra continúa en esta ventana.",
        ),
      );
    setSelected(projects[0].id);
    setEpoch((value) => value + 1);
    setFailed([]);
    setBlocked(false);
    setDisplayError("");
    setPresenting(true);
    setPlaying(true);
  }
  return (
    <>
      <PresentationSetup
        projects={projects}
        loading={loading}
        error={error}
        seconds={seconds}
        muted={muted}
        onSeconds={setSeconds}
        onMute={() => setMuted((value) => !value)}
        onStart={start}
        onBack={onBack}
        onRefresh={() => void load()}
      />
      {presenting && project && (
        <PresentationViewer
          playing={!!active}
          index={projects.findIndex((item) => item.id === project.id)}
          total={projects.length}
          muted={muted}
          onMute={() => setMuted((value) => !value)}
          onClose={close}
          onToggle={() => setPlaying((value) => !value)}
          onNext={next}
          onPrevious={() => advance(-1)}
          message={
            blocked
              ? "El navegador bloqueó el sonido. Reanudá para continuar sin sonido."
              : displayError
          }
          onContinue={
            blocked
              ? () => {
                  setMuted(true);
                  setBlocked(false);
                  setPlaying(true);
                }
              : undefined
          }
        >
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
        </PresentationViewer>
      )}
    </>
  );
}
