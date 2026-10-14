import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  ArrowRight,
  ImageSquare,
  MagnifyingGlass,
  MapPin,
  PencilSimple,
  Plus,
  Trash,
  X,
} from '@phosphor-icons/react';
import ProjectArt from '../components/ProjectArt';
import ProjectTeamEditor from '../components/ProjectTeamEditor';
import { useDemo } from '../hooks/useDemo';
import { formatDate, statusLabel, teacherNames } from '../lib/format';
import { isProjectMember, projectMembers, teamErrors } from '../lib/team';
import type { DemoState, Project, ProjectStatus } from '../lib/types';

type Props = {
  onSelect: (id: string) => void;
  creating: boolean;
  onCreatingChange: (value: boolean) => void;
};
type Draft = Omit<
  Project,
  'id' | 'student' | 'status' | 'feedback' | 'createdAt' | 'subjects' | 'resources'
> & {
  subjects: string;
  resources: Record<string, string>;
};
type Errors = Record<string, string>;
const studentName = 'Lucía Fernández';

/** Los proyectos confirmados reservan su mesa; una solicitud todavía puede cambiar de lugar. */
function freeTables(state: DemoState, spaceId: string, projectId?: string) {
  return (state.spaces.find((space) => space.id === spaceId)?.furniture ?? []).filter(
    (item) =>
      item.type === 'table' &&
      !state.projects.some(
        (project) =>
          project.id !== projectId &&
          project.status === 'approved' &&
          project.spaceId === spaceId &&
          project.furnitureId === item.id,
      ),
  );
}

function makeDraft(state: DemoState, project?: Project): Draft {
  const spaceId =
    project?.spaceId ?? state.spaces.find((space) => freeTables(state, space.id).length)?.id ?? '';
  return {
    name: project?.name ?? '',
    description: project?.description ?? '',
    course: project?.course ?? '',
    members: project ? projectMembers(project) : [studentName],
    subjects: project?.subjects.join(', ') ?? '',
    teachers: project?.teachers ?? [],
    spaceId,
    furnitureId: project?.furnitureId ?? '',
    image: project?.image ?? '',
    video: project?.video ?? '',
    category: project?.category ?? 'robot',
    resources: Object.fromEntries(
      state.resources.map((resource) => [
        resource.id,
        String(project?.resources[resource.id] ?? 0),
      ]),
    ),
  };
}

function validateDraft(draft: Draft, state: DemoState, editing?: Project): Errors {
  const errors: Errors = {};
  for (const [index, error] of Object.entries(teamErrors(draft.members)))
    errors[`member-${index}`] = error;
  if (draft.name.trim().length < 3 || draft.name.trim().length > 80)
    errors.name = 'Escribí un nombre de entre 3 y 80 caracteres.';
  if (draft.course.trim().length < 3 || draft.course.trim().length > 100)
    errors.course = 'Indicá el curso y la especialidad (entre 3 y 100 caracteres).';
  if (draft.description.trim().length < 20 || draft.description.trim().length > 800)
    errors.description = 'Contá qué hace el proyecto en entre 20 y 800 caracteres.';
  const subjects = draft.subjects
    .split(',')
    .map((subject) => subject.trim())
    .filter(Boolean);
  if (!subjects.length || subjects.some((subject) => subject.length > 80) || subjects.length > 10)
    errors.subjects =
      'Ingresá de 1 a 10 materias, separadas por comas; hasta 80 caracteres por materia.';
  if (!draft.teachers.length) errors.teachers = 'Elegí al menos un profesor responsable.';
  if (!state.spaces.some((space) => space.id === draft.spaceId))
    errors.spaceId = 'Elegí un espacio disponible.';
  if (
    !freeTables(state, draft.spaceId, editing?.id).some((table) => table.id === draft.furnitureId)
  )
    errors.furnitureId = 'Elegí una mesa disponible en ese espacio.';
  if (!editing && !draft.image)
    errors.image = 'Subí una imagen de referencia para presentar tu proyecto.';
  if (draft.video.trim()) {
    try {
      const url = new URL(draft.video.trim());
      if (!['http:', 'https:'].includes(url.protocol) || !/\.(mp4|webm)$/i.test(url.pathname))
        errors.video = 'Usá un enlace http o https a un archivo .mp4 o .webm.';
    } catch {
      errors.video = 'Ingresá una dirección web completa a un video .mp4 o .webm.';
    }
  }
  for (const resource of state.resources) {
    const value = draft.resources[resource.id] ?? '0';
    if (!/^\d+$/.test(value) || Number(value) > resource.total)
      errors[`resource-${resource.id}`] = `Ingresá un entero entre 0 y ${resource.total}.`;
  }
  return errors;
}

function ProjectForm({ editing, onClose }: { editing?: Project; onClose: () => void }) {
  const { state, role, mutate, notify } = useDemo();
  const [draft, setDraft] = useState(() => makeDraft(state, editing));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempt, setSubmitAttempt] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [imageError, setImageError] = useState('');
  const [readingImage, setReadingImage] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const imageReader = useRef<FileReader | null>(null);
  const errors = validateDraft(draft, state, editing);
  const tables = freeTables(state, draft.spaceId, editing?.id);
  const errorFor = (key: string) => (touched[key] || submitAttempt ? errors[key] : '') ?? '';

  useEffect(() => {
    dialogRef.current?.showModal();
    return () => {
      imageReader.current?.abort();
    };
  }, []);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setTouched((current) => ({ ...current, [key]: true }));
    setSaveError('');
  };

  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    imageReader.current?.abort();
    setReadingImage(false);
    setTouched((current) => ({ ...current, image: true }));
    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setImageError('Elegí una imagen PNG, JPG o WebP de hasta 2 MB.');
      event.target.value = '';
      return;
    }
    setImageError('');
    setReadingImage(true);
    const reader = new FileReader();
    imageReader.current = reader;
    reader.onload = () => {
      update('image', String(reader.result));
      setReadingImage(false);
    };
    reader.onerror = () => {
      setImageError('No pudimos leer la imagen. Intentá con otro archivo.');
      setReadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitAttempt(true);
    if (Object.keys(errors).length || imageError || readingImage) return;
    if (role !== 'student') {
      setSaveError('Solo el perfil de estudiante puede presentar proyectos.');
      return;
    }
    const project: Project = {
      ...draft,
      id: editing?.id ?? crypto.randomUUID(),
      student: editing?.student ?? studentName,
      members: draft.members.map((member) => member.trim().replace(/\s+/g, ' ').normalize('NFC')),
      name: draft.name.trim(),
      course: draft.course.trim(),
      description: draft.description.trim(),
      subjects: [
        ...new Set(
          draft.subjects
            .split(',')
            .map((subject) => subject.trim())
            .filter(Boolean),
        ),
      ],
      resources: Object.fromEntries(
        state.resources
          .map((resource) => [resource.id, Number(draft.resources[resource.id] ?? 0)])
          .filter(([, value]) => Number(value) > 0),
      ),
      video: draft.video.trim(),
      status: 'pending',
      feedback: '',
      createdAt:
        editing?.createdAt ??
        new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).format(
          new Date(),
        ),
    };
    const error = mutate({ type: 'saveProject', project });
    if (error) {
      setSaveError(error);
      return;
    }
    notify(
      editing
        ? 'Proyecto actualizado y enviado a revisión.'
        : 'Proyecto enviado a revisión. Tu lugar se reserva al confirmarlo.',
    );
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="form-dialog"
      aria-labelledby="project-form-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-heading">
        <div>
          <h2 id="project-form-title">{editing ? 'Editar proyecto' : 'Presentar proyecto'}</h2>
          <p className="muted">El profesor revisará la propuesta y confirmará el lugar.</p>
        </div>
        <button
          type="button"
          className="dialog-close"
          aria-label="Cerrar formulario"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </div>
      <form onSubmit={submit} noValidate>
        <section className="form-section" aria-labelledby="project-info-title">
          <h3 id="project-info-title">Tu propuesta</h3>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="project-name">Nombre del proyecto</label>
              <input
                id="project-name"
                value={draft.name}
                maxLength={80}
                onChange={(event) => update('name', event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, name: true }))}
                aria-invalid={!!errorFor('name')}
                aria-describedby={errorFor('name') ? 'project-name-error' : undefined}
                autoFocus
              />
              {errorFor('name') && (
                <small className="field-error" id="project-name-error">
                  {errorFor('name')}
                </small>
              )}
            </div>
            <div className="field">
              <label htmlFor="project-course">Curso y especialidad</label>
              <input
                id="project-course"
                value={draft.course}
                maxLength={100}
                onChange={(event) => update('course', event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, course: true }))}
                aria-invalid={!!errorFor('course')}
                aria-describedby="project-course-help"
              />
              <small
                id="project-course-help"
                className={errorFor('course') ? 'field-error' : 'muted'}
              >
                {errorFor('course') || 'Por ejemplo: 6° 1° · Electromecánica.'}
              </small>
            </div>
          </div>
          <div className="field">
            <label htmlFor="project-description">¿Qué hace el proyecto?</label>
            <textarea
              id="project-description"
              rows={3}
              value={draft.description}
              maxLength={800}
              onChange={(event) => update('description', event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, description: true }))}
              aria-invalid={!!errorFor('description')}
              aria-describedby="project-description-help"
            />
            <small
              id="project-description-help"
              className={errorFor('description') ? 'field-error' : 'muted'}
            >
              {errorFor('description') || `${draft.description.length}/800 caracteres. Mínimo 20.`}
            </small>
          </div>
          <div className="field">
            <label htmlFor="project-subjects">Materias vinculadas</label>
            <input
              id="project-subjects"
              value={draft.subjects}
              onChange={(event) => update('subjects', event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, subjects: true }))}
              aria-invalid={!!errorFor('subjects')}
              aria-describedby="project-subjects-help"
            />
            <small
              id="project-subjects-help"
              className={errorFor('subjects') ? 'field-error' : 'muted'}
            >
              {errorFor('subjects') || 'Separá las materias con una coma.'}
            </small>
          </div>
          <fieldset className="field checkbox-group">
            <legend>Profesores responsables</legend>
            <label>
              <input
                type="checkbox"
                checked={teacherNames.every((name) => draft.teachers.includes(name))}
                onChange={(event) =>
                  update('teachers', event.target.checked ? [...teacherNames] : [])
                }
              />{' '}
              Marcar todos
            </label>
            {teacherNames.map((name) => (
              <label key={name}>
                <input
                  type="checkbox"
                  checked={draft.teachers.includes(name)}
                  onChange={(event) =>
                    update(
                      'teachers',
                      event.target.checked
                        ? [...draft.teachers, name]
                        : draft.teachers.filter((teacher) => teacher !== name),
                    )
                  }
                />{' '}
                {name}
              </label>
            ))}
            {errorFor('teachers') && <small className="field-error">{errorFor('teachers')}</small>}
          </fieldset>
        </section>
        <ProjectTeamEditor
          members={draft.members}
          onChange={(members) => update('members', members)}
          creator={editing?.student ?? studentName}
          currentStudent={studentName}
          submitAttempt={submitAttempt}
        />
        <section className="form-section" aria-labelledby="project-media-title">
          <h3 id="project-media-title">Cómo se verá</h3>
          <div className="field">
            <label htmlFor="project-image">
              Imagen de referencia{editing ? ' (podés reemplazarla)' : ''}
            </label>
            <input
              id="project-image"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={chooseImage}
              aria-invalid={!!(imageError || errorFor('image'))}
              aria-describedby="project-image-help"
            />
            <small
              id="project-image-help"
              className={imageError || errorFor('image') ? 'field-error' : 'muted'}
            >
              {imageError ||
                errorFor('image') ||
                (readingImage ? 'Preparando la imagen…' : 'PNG, JPG o WebP. Hasta 2 MB.')}
            </small>
            {draft.image && (
              <img className="file-preview" src={draft.image} alt="Vista previa de tu proyecto" />
            )}
          </div>
          <div className="field">
            <label htmlFor="project-video">
              Enlace al video explicativo <span className="muted">(opcional)</span>
            </label>
            <input
              id="project-video"
              type="url"
              value={draft.video}
              onChange={(event) => update('video', event.target.value)}
              aria-invalid={!!errorFor('video')}
              aria-describedby="project-video-help"
            />
            <small id="project-video-help" className={errorFor('video') ? 'field-error' : 'muted'}>
              {errorFor('video') ||
                'Enlace directo a un archivo .mp4 o .webm. Se incluirá en el modo TV cuando el proyecto esté confirmado.'}
            </small>
          </div>
        </section>
        <section className="form-section" aria-labelledby="project-place-title">
          <h3 id="project-place-title">Lugar y elementos</h3>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="project-space">Espacio</label>
              <select
                id="project-space"
                value={draft.spaceId}
                onChange={(event) => {
                  update('spaceId', event.target.value);
                  update('furnitureId', '');
                }}
                aria-invalid={!!errorFor('spaceId')}
              >
                <option value="">Elegir espacio</option>
                {state.spaces.map((space) => (
                  <option
                    key={space.id}
                    value={space.id}
                    disabled={!freeTables(state, space.id, editing?.id).length}
                  >
                    {space.name}
                    {!freeTables(state, space.id, editing?.id).length ? ' · Completo' : ''}
                  </option>
                ))}
              </select>
              {errorFor('spaceId') && <small className="field-error">{errorFor('spaceId')}</small>}
            </div>
            <div className="field">
              <label htmlFor="project-table">Mesa disponible</label>
              <select
                id="project-table"
                value={draft.furnitureId}
                onChange={(event) => update('furnitureId', event.target.value)}
                aria-invalid={!!errorFor('furnitureId')}
                disabled={!tables.length}
              >
                <option value="">Elegir mesa</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    Mesa {table.id}
                  </option>
                ))}
              </select>
              {errorFor('furnitureId') && (
                <small className="field-error">{errorFor('furnitureId')}</small>
              )}
            </div>
          </div>
          <p className="muted">
            El lugar quedará ocupado cuando un profesor confirme tu propuesta.
          </p>
          <div className="form-grid resource-fields">
            {state.resources.map((resource) => (
              <div className="field" key={resource.id}>
                <label htmlFor={`project-resource-${resource.id}`}>{resource.name}</label>
                <input
                  id={`project-resource-${resource.id}`}
                  type="number"
                  min="0"
                  max={resource.total}
                  step="1"
                  inputMode="numeric"
                  value={draft.resources[resource.id] ?? '0'}
                  onChange={(event) => {
                    update('resources', { ...draft.resources, [resource.id]: event.target.value });
                    setTouched((current) => ({ ...current, [`resource-${resource.id}`]: true }));
                  }}
                  aria-invalid={!!errorFor(`resource-${resource.id}`)}
                  aria-describedby={`project-resource-help-${resource.id}`}
                />
                <small
                  id={`project-resource-help-${resource.id}`}
                  className={errorFor(`resource-${resource.id}`) ? 'field-error' : 'muted'}
                >
                  {errorFor(`resource-${resource.id}`) ||
                    `${resource.total} en el inventario. Poné 0 si no lo necesitás.`}
                </small>
              </div>
            ))}
          </div>
        </section>
        {saveError && (
          <p className="field-error" role="alert">
            {saveError}
          </p>
        )}
        {submitAttempt && Object.keys(errors).length > 0 && (
          <p className="field-error" role="alert">
            Revisá los campos marcados para enviar tu propuesta.
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={readingImage}>
            {editing ? 'Guardar y enviar a revisión' : 'Enviar a revisión'}
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </dialog>
  );
}

/** Muestra las propuestas accesibles al perfil activo y lleva cada operación al modelo compartido. */
export default function ProjectsPage({ onSelect, creating, onCreatingChange }: Props) {
  const { state, role, mutate, notify } = useDemo();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all');
  const [editing, setEditing] = useState<Project>();
  const [deleting, setDeleting] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const visible = state.projects.filter((project) => {
    if (role === 'guest') return project.status === 'approved';
    if (role === 'student')
      return isProjectMember(project, studentName) || project.status === 'approved';
    if (role === 'teacher') return project.teachers.includes('Martín García');
    return true;
  });
  const filtered = visible.filter(
    (project) =>
      (status === 'all' || project.status === status) &&
      `${project.name} ${projectMembers(project).join(' ')} ${project.course} ${project.subjects.join(' ')}`
        .toLocaleLowerCase('es')
        .includes(search.trim().toLocaleLowerCase('es')),
  );
  const canEdit = (project: Project) =>
    role === 'student' && isProjectMember(project, studentName) && project.status !== 'approved';
  const canDelete = (project: Project) => canEdit(project) || role === 'admin';
  const closeForm = () => {
    setEditing(undefined);
    onCreatingChange(false);
  };
  const deleteProject = (project: Project) => {
    const error = mutate({ type: 'deleteProject', id: project.id });
    if (error) {
      setDeleteError(error);
      return;
    }
    setDeleting('');
    setDeleteError('');
    notify('Proyecto eliminado.');
  };

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{role === 'guest' ? 'Proyectos de la ExpoTec' : 'Proyectos'}</h1>
          <p>
            {role === 'teacher'
              ? 'Revisá las propuestas en las que sos responsable.'
              : role === 'student'
                ? 'Presentá tu idea, elegí tu lugar y seguí la revisión.'
                : role === 'guest'
                  ? 'Conocé lo que prepararon los estudiantes para la muestra.'
                  : 'Todas las propuestas, su ubicación y los elementos que necesitan.'}
          </p>
        </div>
        {role === 'student' && (
          <button className="btn btn-primary" onClick={() => onCreatingChange(true)}>
            <Plus size={18} />
            Presentar proyecto
          </button>
        )}
      </header>
      <div className="project-toolbar">
        <div className="field search-field">
          <label htmlFor="project-search">Buscar proyectos</label>
          <div>
            <MagnifyingGlass size={19} aria-hidden="true" />
            <input
              id="project-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
        {role !== 'guest' && (
          <div className="filter-tabs" role="group" aria-label="Filtrar por estado">
            {(['all', 'approved', 'pending', 'changes'] as const).map((value) => (
              <button
                key={value}
                className={status === value ? 'active' : ''}
                aria-pressed={status === value}
                onClick={() => setStatus(value)}
              >
                {value === 'all' ? 'Todos' : statusLabel[value]}
                <span>
                  {visible.filter((project) => value === 'all' || project.status === value).length}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="section-heading">
        <h2>
          {role === 'teacher'
            ? 'Propuestas a tu cargo'
            : role === 'guest'
              ? 'Para descubrir'
              : 'Las ideas de este año'}
        </h2>
        <span className="muted">
          {filtered.length} {filtered.length === 1 ? 'proyecto' : 'proyectos'}
        </span>
      </div>
      {filtered.length ? (
        <div className="project-grid">
          {filtered.map((project) => {
            const space = state.spaces.find((item) => item.id === project.spaceId);
            const members = projectMembers(project);
            return (
              <article key={project.id} className="project-card">
                <button
                  className="project-art-link"
                  aria-label={`Ver ${project.name}`}
                  onClick={() => onSelect(project.id)}
                >
                  <ProjectArt project={project} />
                </button>
                <div className="project-card-body">
                  <div className="project-card-status">
                    <span className={`status-badge status-${project.status}`}>
                      {statusLabel[project.status]}
                    </span>
                    {isProjectMember(project, studentName) && role === 'student' && (
                      <small className="muted">Tu proyecto</small>
                    )}
                  </div>
                  <h3>
                    <button className="project-title-link" onClick={() => onSelect(project.id)}>
                      {project.name}
                    </button>
                  </h3>
                  <p className="project-summary">{project.description}</p>
                  <div className="project-team">
                    <span className="meta">
                      {members.length} {members.length === 1 ? 'integrante' : 'integrantes'}
                    </span>
                    <div>{members.join(' · ')}</div>
                    <span className="meta">{project.course}</span>
                  </div>
                  <p className="project-location">
                    <MapPin size={16} />
                    {space?.name ?? 'Espacio no disponible'} · Mesa {project.furnitureId}
                  </p>
                  <div className="project-card-footer">
                    <span className="meta">Creado {formatDate(project.createdAt)}</span>
                    <button className="btn btn-quiet" onClick={() => onSelect(project.id)}>
                      Ver proyecto
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  {(canEdit(project) || canDelete(project)) && (
                    <div className="project-card-controls">
                      {canEdit(project) && (
                        <button className="btn btn-quiet" onClick={() => setEditing(project)}>
                          <PencilSimple size={16} />
                          Editar
                        </button>
                      )}
                      {canDelete(project) && deleting !== project.id && (
                        <button
                          className="btn btn-quiet danger"
                          onClick={() => {
                            setDeleting(project.id);
                            setDeleteError('');
                          }}
                        >
                          <Trash size={16} />
                          Eliminar
                        </button>
                      )}
                    </div>
                  )}
                  {deleting === project.id && (
                    <div className="inline-confirm">
                      <p>¿Estás seguro de que querés eliminar «{project.name}»?</p>
                      <div>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setDeleting('');
                            setDeleteError('');
                          }}
                        >
                          Cancelar
                        </button>
                        <button
                          className="btn btn-primary danger"
                          onClick={() => deleteProject(project)}
                        >
                          Sí, eliminar
                        </button>
                      </div>
                      {deleteError && (
                        <small className="field-error" role="alert">
                          {deleteError}
                        </small>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <ImageSquare size={34} />
          <h3>
            {search || status !== 'all' ? 'No encontramos proyectos' : 'Todavía no hay propuestas'}
          </h3>
          <p>
            {search || status !== 'all'
              ? 'Probá con otro nombre o cambiá el filtro.'
              : 'Los proyectos aparecerán acá cuando se presenten.'}
          </p>
          {(search || status !== 'all') && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearch('');
                setStatus('all');
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
      {(creating || editing) && (
        <ProjectForm key={editing?.id ?? 'new'} editing={editing} onClose={closeForm} />
      )}
    </>
  );
}
