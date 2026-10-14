import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeftIcon,
  ArrowsOutIcon,
  CaretLeftIcon,
  CaretRightIcon,
  PauseIcon,
  PlayIcon,
  MapPinIcon,
} from '@phosphor-icons/react';
import { useDemo } from '../hooks/useDemo';
import ProjectArt from '../components/ProjectArt';
import { projectMembers } from '../lib/team';

export default function PresentationPage({ onBack }: { onBack: () => void }) {
  const { state, notify } = useDemo();
  const projects = state.projects.filter((p) => p.status === 'approved');
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const container = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const project = projects.length ? projects[index % projects.length] : undefined;
  const hasVideo = Boolean(project?.video && !failed.includes(project.id));
  const next = () => setIndex((i) => (projects.length ? (i + 1) % projects.length : 0));
  useEffect(() => {
    if (!playing || !projects.length || hasVideo) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % projects.length), 8000);
    return () => window.clearTimeout(timer);
  }, [playing, projects.length, index, hasVideo]);
  useEffect(() => {
    if (!video.current) return;
    if (playing)
      video.current.play().catch(() => {
        setPlaying(false);
        notify('Tocá reproducir en el video para habilitarlo en este navegador.');
      });
    else video.current.pause();
  }, [playing, project?.id, notify]);
  return (
    <div className="tv-screen" ref={container}>
      <div className="tv-top">
        <button className="btn btn-quiet" onClick={onBack}>
          <ArrowLeftIcon size={19} /> Volver
        </button>
        <span className="tv-brand">
          expotec<span>.</span>
        </span>
        <span className="tv-counter">
          {projects.length ? (index % projects.length) + 1 : 0} / {projects.length}
        </span>
      </div>
      {project ? (
        <div className="tv-slide" key={project.id}>
          <div className="tv-visual">
            {hasVideo ? (
              <video
                ref={video}
                src={project.video}
                controls
                onEnded={next}
                onError={() => {
                  setFailed((previous) => [...previous, project.id]);
                  notify('El video no está disponible. Mostramos la ficha del proyecto.');
                }}
              />
            ) : (
              <ProjectArt project={project} />
            )}
          </div>
          <div className="tv-copy">
            <span className="tag">{project.course}</span>
            <h1>{project.name}</h1>
            <p>{project.description}</p>
            <p className="tv-team">
              <strong>Equipo</strong>
              {projectMembers(project).join(' · ')}
            </p>
            <div className="tag-list">
              {project.subjects.map((s) => (
                <span className="tag" key={s}>
                  {s}
                </span>
              ))}
            </div>
            <div className="tv-location">
              <MapPinIcon size={24} /> {state.spaces.find((s) => s.id === project.spaceId)?.name} ·
              Puesto {project.furnitureId}
            </div>
            {failed.includes(project.id) && (
              <p className="meta">Video no disponible · presentación con ficha</p>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <h2>Todavía no hay proyectos confirmados</h2>
          <p>La presentación se completa cuando se confirman los proyectos.</p>
        </div>
      )}
      <div className="tv-controls">
        <button
          className="btn btn-secondary"
          disabled={!projects.length}
          onClick={() => setIndex((i) => (i - 1 + projects.length) % projects.length)}
          aria-label="Proyecto anterior"
        >
          <CaretLeftIcon size={22} />
        </button>
        <button
          className="btn btn-primary"
          disabled={!projects.length}
          onClick={() => setPlaying(!playing)}
        >
          {playing ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          {playing ? 'Pausar presentación' : 'Iniciar presentación'}
        </button>
        <button
          className="btn btn-secondary"
          disabled={!projects.length}
          onClick={next}
          aria-label="Proyecto siguiente"
        >
          <CaretRightIcon size={22} />
        </button>
        <button
          className="btn btn-quiet"
          onClick={() => {
            if (document.fullscreenElement)
              document
                .exitFullscreen()
                .catch(() => notify('No se pudo salir de pantalla completa.'));
            else
              container.current
                ?.requestFullscreen()
                .catch(() => notify('Este navegador no permite activar pantalla completa.'));
          }}
          aria-label="Cambiar pantalla completa"
        >
          <ArrowsOutIcon size={22} />
        </button>
      </div>
      <p className="tv-hint">Las fichas avanzan cada 8 segundos. Los videos avanzan al terminar.</p>
    </div>
  );
}
