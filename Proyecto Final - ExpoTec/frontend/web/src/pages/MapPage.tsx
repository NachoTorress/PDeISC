import { useState } from 'react';
import {
  ArrowUpRightIcon,
  MapPinIcon,
  PlusIcon,
  PencilSimpleIcon,
  CheckIcon,
  ArrowLeftIcon,
  TrashIcon,
  PlugIcon,
  TableIcon,
  TagIcon,
} from '@phosphor-icons/react';
import { useDemo } from '../hooks/useDemo';
import Floorplan from '../components/Floorplan';
import SpaceTools from '../components/SpaceTools';
import ProjectArt from '../components/ProjectArt';
import type { Space } from '../lib/types';
import { formatDate } from '../lib/format';
import { isProjectMember } from '../lib/team';

export default function MapPage({
  onSelectProject,
  onProjects,
  onNewProject,
}: {
  onSelectProject: (id: string) => void;
  onProjects: () => void;
  onNewProject: () => void;
}) {
  const { state, role, mutate, notify } = useDemo();
  const [spaceId, setSpaceId] = useState('patio');
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Space | null>(null);
  const [adding, setAdding] = useState(false);
  const [spaceName, setSpaceName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const source = state.spaces.find((s) => s.id === spaceId) || state.spaces[0];
  const space = draft || source;
  const visible = state.projects.filter(
    (p) =>
      p.status === 'approved' ||
      role === 'admin' ||
      (role === 'student' && isProjectMember(p, 'Lucía Fernández')) ||
      (role === 'teacher' && p.teachers.includes('Martín García')),
  );
  const approved = visible.filter((p) => p.status === 'approved');
  const spaceProjects = visible.filter((p) => p.spaceId === space?.id);
  const tables = space?.furniture.filter((f) => f.type === 'table') || [];
  const taken = spaceProjects.filter((p) => p.status === 'approved').length;
  const chosen = spaceProjects.find((p) => p.furnitureId === selected && p.status === 'approved');
  const selectedItem = space?.furniture.find((f) => f.id === selected);
  const pending = visible.filter((p) => p.status === 'pending');

  function changeSpace(id: string) {
    setSpaceId(id);
    setSelected(null);
    setDraft(null);
    setConfirmDelete(false);
    setError('');
  }
  function save() {
    if (!draft) return;
    const result = mutate({ type: 'saveSpace', space: draft });
    if (result) {
      setError(result);
      return;
    }
    setDraft(null);
    setError('');
    notify('La distribución quedó guardada en este navegador.');
  }
  function addSpace() {
    const next: Space = {
      id: crypto.randomUUID(),
      name: spaceName.trim(),
      description: 'Espacio nuevo · configurá su distribución',
      furniture: [],
      createdAt: new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Argentina/Buenos_Aires',
      }).format(new Date()),
    };
    const result = mutate({ type: 'saveSpace', space: next });
    if (result) {
      setError(result);
      return;
    }
    setAdding(false);
    setSpaceName('');
    setSpaceId(next.id);
    setDraft(next);
    setSelected(null);
    setError('');
    notify('Espacio creado. Agregá su mobiliario.');
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Todo en su lugar.</h1>
          <p>Organizá los espacios y dale lugar a cada proyecto.</p>
        </div>
        {role === 'admin' ? (
          <button className="btn btn-primary" onClick={() => setAdding(!adding)}>
            <PlusIcon size={19} /> Nuevo espacio
          </button>
        ) : role === 'student' ? (
          <button className="btn btn-primary" onClick={onNewProject}>
            <PlusIcon size={19} /> Cargar mi proyecto
          </button>
        ) : (
          <button className="btn btn-secondary" onClick={onProjects}>
            Ver proyectos <ArrowUpRightIcon size={17} />
          </button>
        )}
      </div>
      <div className="overview-strip">
        <div>
          <span className="overview-dot" />
          <strong>{approved.length}</strong> proyectos confirmados
        </div>
        <div>
          <TableIcon size={18} />
          <strong>
            {state.spaces.flatMap((s) => s.furniture).filter((f) => f.type === 'table').length -
              approved.length}
          </strong>{' '}
          puestos disponibles
        </div>
        <div>
          <MapPinIcon size={18} />
          <strong>{state.spaces.length}</strong> espacios
        </div>
        <span className="overview-caption">Una muestra. Muchas ideas.</span>
      </div>
      {adding && (
        <div className="inline-space-form">
          <div className="field">
            <label htmlFor="new-space">Nombre del nuevo espacio</label>
            <input
              id="new-space"
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              maxLength={80}
              aria-invalid={Boolean(spaceName && spaceName.trim().length < 2)}
              autoFocus
            />
            {spaceName && spaceName.trim().length < 2 && (
              <span className="field-error">Escribí al menos 2 caracteres.</span>
            )}
          </div>
          <button
            className="btn btn-primary"
            disabled={spaceName.trim().length < 2}
            onClick={addSpace}
          >
            Crear espacio
          </button>
          <button
            className="btn btn-quiet"
            onClick={() => {
              setAdding(false);
              setError('');
            }}
          >
            Cancelar
          </button>
        </div>
      )}
      <div className="space-tabs" role="group" aria-label="Espacios de la escuela">
        {state.spaces.map((s) => (
          <button
            className={`space-tab ${space?.id === s.id ? 'active' : ''}`}
            disabled={Boolean(draft && draft.id !== s.id)}
            key={s.id}
            onClick={() => changeSpace(s.id)}
          >
            <MapPinIcon size={17} />
            {s.name}
            <span>
              {state.projects.filter((p) => p.spaceId === s.id && p.status === 'approved').length}/
              {s.furniture.filter((f) => f.type === 'table').length}
            </span>
          </button>
        ))}
      </div>
      {error && (
        <div className="alert-note" role="alert">
          {error}
        </div>
      )}
      {space ? (
        <div className="map-layout">
          <section className="map-panel">
            <div className="map-panel-heading">
              <div>
                <h2>{space.name}</h2>
                <span className="meta">{space.description}</span>
              </div>
              {role === 'admin' &&
                (draft ? (
                  <div className="form-actions">
                    <button
                      className="btn btn-quiet"
                      onClick={() => {
                        setDraft(null);
                        setSelected(null);
                        setError('');
                      }}
                    >
                      <ArrowLeftIcon size={17} /> Cancelar
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={
                        !draft.name.trim() ||
                        draft.furniture.some(
                          (f) => f.type === 'label' && (f.text?.trim().length ?? 0) < 2,
                        )
                      }
                      onClick={save}
                    >
                      <CheckIcon size={18} /> Guardar plano
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setDraft(structuredClone(space));
                      setSelected(null);
                    }}
                  >
                    <PencilSimpleIcon size={17} /> Acomodar espacio
                  </button>
                ))}
            </div>
            <Floorplan
              space={space}
              projects={visible}
              editing={Boolean(draft)}
              selected={selected}
              onSelect={(id) => setSelected(id)}
              onResize={(id, geometry) => {
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        furniture: current.furniture.map((f) =>
                          f.id === id ? { ...f, ...geometry } : f,
                        ),
                      }
                    : null,
                );
              }}
              onFit={(positions) => {
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        furniture: current.furniture.map((f) => {
                          const position = positions.find((p) => p.id === f.id);
                          return position ? { ...f, x: position.x, y: position.y } : f;
                        }),
                      }
                    : null,
                );
              }}
              onMove={(id, x, y) => {
                if (draft)
                  setDraft({
                    ...draft,
                    furniture: draft.furniture.map((f) => (f.id === id ? { ...f, x, y } : f)),
                  });
              }}
            />
            <div className="plan-footer">
              <div className="legend">
                <span>
                  <i className="legend-dot free" /> Disponible
                </span>
                <span>
                  <i className="legend-dot occupied" /> Ocupado
                </span>
                {role !== 'guest' && (
                  <span>
                    <i className="legend-dot pending" /> Solicitado
                  </span>
                )}
              </div>
              <span className="meta">Elegí un puesto para ver más</span>
            </div>
          </section>
          <aside className="map-sidebar">
            {draft ? (
              <SpaceTools
                space={draft}
                selected={selected}
                onChange={setDraft}
                onSelect={setSelected}
              />
            ) : chosen ? (
              <div className="selected-project">
                <div className="section-heading">
                  <span className="status-badge status-approved">
                    Puesto {chosen.furnitureId} · ocupado
                  </span>
                </div>
                <ProjectArt project={chosen} />
                <h3>{chosen.name}</h3>
                <p>{chosen.description}</p>
                <div className="meta">{chosen.course}</div>
                <button
                  className="btn btn-primary w-100"
                  onClick={() => onSelectProject(chosen.id)}
                >
                  Ver proyecto <ArrowUpRightIcon size={18} />
                </button>
              </div>
            ) : selectedItem ? (
              <div className="selected-free">
                <div className="selected-free-icon">
                  {selectedItem.type === 'power' ? (
                    <PlugIcon size={38} />
                  ) : selectedItem.type === 'label' ? (
                    <TagIcon size={38} />
                  ) : (
                    <TableIcon size={38} />
                  )}
                </div>
                <h3>
                  {selectedItem.type === 'table'
                    ? `Puesto ${selectedItem.id}`
                    : selectedItem.type === 'bench'
                      ? 'Banco'
                      : selectedItem.type === 'label'
                        ? selectedItem.text
                        : 'Punto eléctrico'}
                </h3>
                <p>
                  {selectedItem.type === 'table'
                    ? 'Este puesto está disponible. Se ocupa cuando un profesor confirma un proyecto.'
                    : selectedItem.type === 'power'
                      ? 'Referencia de ubicación. No certifica capacidad ni seguridad eléctrica.'
                      : selectedItem.type === 'label'
                        ? 'Referencia de zona para orientarte dentro de este espacio.'
                        : 'Mobiliario del espacio. No es un puesto de inscripción.'}
                </p>
                {role === 'student' && selectedItem.type === 'table' && (
                  <button className="btn btn-primary w-100" onClick={onNewProject}>
                    Cargar un proyecto <PlusIcon size={18} />
                  </button>
                )}
                <button className="btn btn-quiet w-100" onClick={() => setSelected(null)}>
                  Volver al resumen
                </button>
              </div>
            ) : (
              <>
                <div className="space-summary">
                  <div className="section-heading">
                    <h3>El espacio, de un vistazo</h3>
                    <MapPinIcon size={21} />
                  </div>
                  <div className="space-occupancy">
                    <span>
                      <strong>{tables.length - taken}</strong> puestos libres
                    </span>
                    <div className="occupancy-dots">
                      {tables.map((_, i) => (
                        <i key={i} className={i < taken ? 'taken' : ''} />
                      ))}
                    </div>
                  </div>
                  <div className="summary-row">
                    <span>Puestos ocupados</span>
                    <strong>
                      {taken} de {tables.length}
                    </strong>
                  </div>
                  <div className="summary-row">
                    <span>Puntos eléctricos de ejemplo</span>
                    <strong>{space.furniture.filter((f) => f.type === 'power').length}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Creado el</span>
                    <strong>{formatDate(space.createdAt)}</strong>
                  </div>
                  <p className="meta">
                    Seleccioná una mesa en el plano para ver el proyecto o su disponibilidad.
                  </p>
                </div>
                {pending.length > 0 && role !== 'guest' && (
                  <div className="pending-panel">
                    <div className="section-heading">
                      <h3>Por confirmar</h3>
                      <span className="count">{pending.length}</span>
                    </div>
                    {pending.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        className="pending-project"
                        onClick={() => onSelectProject(p.id)}
                      >
                        <ProjectArt project={p} compact />
                        <span>
                          <strong>{p.name}</strong>
                          <small>
                            {p.furnitureId} · {p.course.split(' · ')[0]}
                          </small>
                        </span>
                        <ArrowUpRightIcon size={19} />
                      </button>
                    ))}
                    <p className="meta">El lugar se ocupa después de la confirmación.</p>
                  </div>
                )}
                <div className="electrical-note">
                  <PlugIcon size={21} />
                  <p>
                    Para una ExpoTec segura, la distribución eléctrica debe revisarla personal
                    habilitado.
                  </p>
                </div>
                {role === 'admin' &&
                  !state.projects.some((p) => p.spaceId === space.id) &&
                  (confirmDelete ? (
                    <div className="inline-confirm">
                      <p>¿Seguro que querés eliminar {space.name} y su distribución?</p>
                      <button
                        className="btn btn-danger"
                        onClick={() => {
                          const result = mutate({ type: 'deleteSpace', id: space.id });
                          if (result) setError(result);
                          else {
                            setConfirmDelete(false);
                            setSelected(null);
                            notify('Espacio eliminado.');
                          }
                        }}
                      >
                        Eliminar espacio
                      </button>
                      <button className="btn btn-quiet" onClick={() => setConfirmDelete(false)}>
                        Conservar
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-quiet danger-text"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <TrashIcon size={17} /> Eliminar espacio vacío
                    </button>
                  ))}
              </>
            )}
          </aside>
        </div>
      ) : (
        <div className="empty-state">
          <MapPinIcon size={36} />
          <h2>Creá el primer espacio</h2>
          <p>Agregá un aula o patio para empezar a acomodar sus puestos.</p>
        </div>
      )}
      <section className="map-projects">
        <div className="section-heading">
          <h2>Lo que vas a encontrar</h2>
          <button className="btn btn-quiet" onClick={onProjects}>
            Todos los proyectos <ArrowUpRightIcon size={18} />
          </button>
        </div>
        <div className="featured-projects">
          {approved.slice(0, 3).map((p) => (
            <button className="featured-project" key={p.id} onClick={() => onSelectProject(p.id)}>
              <ProjectArt project={p} compact />
              <span>
                <strong>{p.name}</strong>
                <small>
                  {p.course}
                  <br />
                  {state.spaces.find((s) => s.id === p.spaceId)?.name} · {p.furnitureId}
                </small>
              </span>
              <ArrowUpRightIcon size={20} />
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
