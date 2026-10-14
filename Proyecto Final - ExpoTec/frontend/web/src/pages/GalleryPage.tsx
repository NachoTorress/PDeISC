import { useState } from 'react';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  ArrowUpRightIcon,
  TelevisionIcon,
} from '@phosphor-icons/react';
import { useDemo } from '../hooks/useDemo';
import ProjectArt from '../components/ProjectArt';
import { formatDate } from '../lib/format';
import { projectMembers } from '../lib/team';

export default function GalleryPage({
  onSelect,
  onPresentation,
}: {
  onSelect: (id: string) => void;
  onPresentation: () => void;
}) {
  const { state } = useDemo();
  const [query, setQuery] = useState('');
  const projects = state.projects.filter(
    (p) =>
      p.status === 'approved' &&
      `${p.name} ${p.course} ${p.subjects.join(' ')} ${projectMembers(p).join(' ')}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Ideas que toman forma.</h1>
          <p>Conocé los proyectos de nuestra ExpoTec.</p>
        </div>
        <button className="btn btn-primary" onClick={onPresentation}>
          <TelevisionIcon size={19} /> Presentación en TV
        </button>
      </div>
      <div className="gallery-intro">
        <div>
          <span className="status-badge status-approved">Abierto a todos</span>
          <h2>
            Un año de trabajo.
            <br />
            Mucho para descubrir.
          </h2>
          <p>
            Recorré los proyectos, conocé lo que hay detrás de cada idea y encontrá dónde se
            presenta.
          </p>
        </div>
        <div className="gallery-emblem">
          <PlantIconFallback />
        </div>
      </div>
      <div className="section-heading">
        <h2>
          Explorá los proyectos <span className="count">{projects.length}</span>
        </h2>
        <div className="field gallery-search">
          <label htmlFor="gallery-search">Buscar proyecto, integrante, curso o materia</label>
          <div className="search-field">
            <MagnifyingGlassIcon size={18} />
            <input id="gallery-search" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="project-grid">
        {projects.map((project) => (
          <article className="project-card" key={project.id}>
            <button
              className="card-image-button"
              onClick={() => onSelect(project.id)}
              aria-label={`Ver ${project.name}`}
            >
              <ProjectArt project={project} />
            </button>
            <div className="project-card-body">
              <div className="meta">{project.course}</div>
              <button className="project-title" onClick={() => onSelect(project.id)}>
                {project.name}
                <ArrowUpRightIcon size={19} />
              </button>
              <p>{project.description}</p>
              <div className="project-team">
                <strong>
                  {projectMembers(project).length}{' '}
                  {projectMembers(project).length === 1 ? 'integrante' : 'integrantes'}
                </strong>
                <span>{projectMembers(project).join(' · ')}</span>
              </div>
              <div className="tag-list">
                {project.subjects.map((s) => (
                  <span className="tag" key={s}>
                    {s}
                  </span>
                ))}
              </div>
              <div className="card-footer-line">
                <span>
                  <MapPinIcon size={15} />{' '}
                  {state.spaces.find((s) => s.id === project.spaceId)?.name} · {project.furnitureId}
                </span>
                <span>{formatDate(project.createdAt)}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!projects.length && (
        <div className="empty-state">
          <h3>No hay proyectos para esa búsqueda</h3>
          <p>Probá con otro nombre, curso o materia.</p>
        </div>
      )}
    </>
  );
}

function PlantIconFallback() {
  return (
    <>
      <span className="emblem-dot" />
      <span className="emblem-line" />
      <span className="emblem-ring" />
      <span className="emblem-number">ET</span>
    </>
  );
}
