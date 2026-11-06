/** Presentación de los proyectos de ejemplo con el mismo visor que la muestra pública. */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useDemo } from "../hooks/useDemo";
import {
  usePresentationDisplay,
  usePresentationKeyboard,
} from "../hooks/usePresentationDisplay";
import { PresentationSetup } from "../components/PresentationSetup";
import { PresentationViewer } from "../components/PresentationViewer";
import { SharedPresentationCard } from "../components/SharedPresentationCard";
import { SharedPresentationVideo } from "../components/SharedPresentationVideo";
import { projectMembers } from "../lib/team";

export default function PresentationPage({ onBack }: { onBack: () => void }) {
  const { state } = useDemo();
  const focused = useIsFocused();
  const display = usePresentationDisplay();
  const projects = useMemo(
    () =>
      state.projects
        .filter((project) => project.status === "approved")
        .map((project) => ({
          id: project.id,
          name: project.name,
          description: project.description,
          course: project.course,
          imageUrl: project.image,
          videoUrl: project.video,
          furnitureId: project.furnitureId,
          spaceName:
            state.spaces.find((space) => space.id === project.spaceId)?.name ??
            "ExpoTec",
          members: projectMembers(project).map((name) => ({
            firstName: name,
            lastName: "",
          })),
          teachers: project.teachers.map((name) => ({
            firstName: name,
            lastName: "",
          })),
          subjects: project.subjects,
        })),
    [state.projects, state.spaces],
  );
  const [index, setIndex] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [seconds, setSeconds] = useState("8");
  const [failed, setFailed] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [blocked, setBlocked] = useState(false);
  const project = projects[index % projects.length];
  const hasVideo = !!project?.videoUrl && !failed.includes(project.id);
  const active = presenting && playing && focused && display.visible;
  const advance = useCallback(
    (direction = 1) => {
      setIndex((value) =>
        projects.length
          ? (value + direction + projects.length) % projects.length
          : 0,
      );
      setEpoch((value) => value + 1);
      setBlocked(false);
    },
    [projects.length],
  );
  const next = useCallback(() => advance(), [advance]);
  const fail = useCallback(() => {
    if (project)
      setFailed((value) =>
        value.includes(project.id) ? value : [...value, project.id],
      );
  }, [project]);
  const block = useCallback(() => {
    setPlaying(false);
    setBlocked(true);
  }, []);
  const close = useCallback(() => {
    setPresenting(false);
    setPlaying(false);
    void display.exit().catch(() => {});
  }, [display.exit]);
  useEffect(() => {
    if (presenting && (!focused || !project)) close();
  }, [presenting, focused, project, close]);
  useEffect(() => {
    if (!display.visible) setPlaying(false);
  }, [display.visible]);
  useEffect(() => {
    if (!active || !project || hasVideo) return;
    const timer = setTimeout(next, Number(seconds) * 1000);
    return () => clearTimeout(timer);
  }, [active, project, hasVideo, epoch, seconds, next]);
  usePresentationKeyboard(presenting, {
    close,
    next,
    previous: () => advance(-1),
    toggle: () => setPlaying((value) => !value),
  });
  function start() {
    void display
      .enter()
      .catch(() =>
        setMessage(
          "El navegador no permitió ocultar su barra. La muestra continúa en esta ventana.",
        ),
      );
    setIndex(0);
    setEpoch((value) => value + 1);
    setFailed([]);
    setBlocked(false);
    setMessage("");
    setPresenting(true);
    setPlaying(true);
  }
  return (
    <>
      <PresentationSetup
        projects={projects}
        seconds={seconds}
        muted={muted}
        onSeconds={setSeconds}
        onMute={() => setMuted((value) => !value)}
        onStart={start}
        onBack={onBack}
      />
      {presenting && project && (
        <PresentationViewer
          playing={active}
          index={index % projects.length}
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
              : message
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
            videoFailed={failed.includes(project.id)}
            video={
              hasVideo ? (
                <SharedPresentationVideo
                  key={`${project.id}:${epoch}`}
                  uri={project.videoUrl}
                  playing={active}
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
