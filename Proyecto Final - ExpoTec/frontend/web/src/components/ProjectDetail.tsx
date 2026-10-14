import { useState } from 'react';
import {
  ArrowCounterClockwise,
  Check,
  CheckCircle,
  MapPin,
  PaperPlaneTilt,
  X,
} from '@phosphor-icons/react';
import { useDemo } from '../hooks/useDemo';
import { formatDate, statusLabel } from '../lib/format';
import type { Project } from '../lib/types';
import ProjectArt from './ProjectArt';
import { projectMembers } from '../lib/team';

/** Presenta una propuesta; las revisiones actualizan el estado y reservan o liberan su mesa. */
export default function ProjectDetail({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const { state, role, mutate, notify } = useDemo();
  const [requestingChanges, setRequestingChanges] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackTouched, setFeedbackTouched] = useState(false);
  const [error, setError] = useState('');
  const [reopening, setReopening] = useState(false);
  const space = state.spaces.find((item) => item.id === project.spaceId);
  const assignedTeacher = role === 'teacher' && project.teachers.includes('Martín García');
  const canReview = assignedTeacher && project.status === 'pending';
  const feedbackError =
    feedback.trim().length < 10
      ? 'Explicá qué debe cambiar el equipo con al menos 10 caracteres.'
      : feedback.trim().length > 600
        ? 'El comentario puede tener hasta 600 caracteres.'
        : '';
  const resources = state.resources.filter((resource) => (project.resources[resource.id] ?? 0) > 0);
  const members = projectMembers(project);

  const review = (action: 'approve' | 'changes' | 'reopen') => {
    if (action === 'changes') {
      setFeedbackTouched(true);
      if (feedbackError) return;
    }
    const result = mutate({
      type: 'review',
      id: project.id,
      action,
      ...(action === 'changes' ? { feedback: feedback.trim() } : {}),
    });
    if (result) {
      setError(result);
      return;
    }
    notify(
      action === 'approve'
        ? 'Proyecto confirmado. La mesa quedó reservada.'
        : action === 'changes'
          ? 'Cambios enviados al estudiante.'
          : 'Proyecto reabierto. La mesa quedó disponible.',
    );
    setError('');
    setRequestingChanges(false);
    setReopening(false);
  };

  return (
    <>
      <header className="detail-header">
        <div>
          <span className={`status-badge status-${project.status}`}>
            {statusLabel[project.status]}
          </span>
          <h2 id="project-detail-title">{project.name}</h2>
          <p className="muted">{project.course}</p>
        </div>
        <button className="dialog-close" aria-label="Cerrar proyecto" onClick={onClose}>
          <X size={22} />
        </button>
      </header>
      <div className="detail-content">
        <ProjectArt project={project} compact />
        <section className="detail-section" aria-labelledby="project-team-title">
          <h3 id="project-team-title">Integrantes del equipo ({members.length})</h3>
          <ul className="project-member-list">
            {members.map((member) => (
              <li key={member}>
                <span>{member}</span>
                {member === project.student && <span className="meta">Creó la propuesta</span>}
              </li>
            ))}
          </ul>
        </section>
        <section className="detail-section">
          <h3>La propuesta</h3>
          <p>{project.description}</p>
          <dl className="detail-facts">
            <div>
              <dt>Ubicación {project.status === 'approved' ? 'confirmada' : 'solicitada'}</dt>
              <dd>
                <MapPin size={17} />
                {space?.name ?? 'Espacio no disponible'} · Mesa {project.furnitureId}
              </dd>
            </div>
            <div>
              <dt>Profesores responsables</dt>
              <dd>{project.teachers.join(' · ')}</dd>
            </div>
            <div>
              <dt>Fecha de creación</dt>
              <dd>{formatDate(project.createdAt)}</dd>
            </div>
          </dl>
          <div className="tag-list" aria-label="Materias">
            {project.subjects.map((subject) => (
              <span className="tag" key={subject}>
                {subject}
              </span>
            ))}
          </div>
        </section>
        <section className="detail-section">
          <h3>Elementos solicitados</h3>
          {resources.length ? (
            <ul className="detail-resource-list">
              {resources.map((resource) => (
                <li key={resource.id}>
                  <span>{resource.name}</span>
                  <strong>{project.resources[resource.id]}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Este proyecto no solicitó elementos del inventario.</p>
          )}
          <p className="muted">Los préstamos se registran y se devuelven al final de cada día.</p>
        </section>
        {project.video && (
          <section className="detail-section">
            <h3>Video explicativo</h3>
            <video
              src={project.video}
              controls
              preload="metadata"
              className="project-video"
              onError={() =>
                setError(
                  'No pudimos reproducir el video. El equipo puede revisar el enlace desde Editar proyecto.',
                )
              }
            />
            <p className="muted">Los videos de proyectos confirmados se incluyen en el modo TV.</p>
          </section>
        )}
        {project.feedback && (
          <section className="alert-note">
            <h3>Devolución del profesor</h3>
            <p>{project.feedback}</p>
          </section>
        )}
        {canReview && (
          <section className="detail-section review-section">
            <h3>Revisión del proyecto</h3>
            <p className="muted">
              Al confirmar, se reserva la mesa solicitada y el proyecto aparece en la muestra
              pública.
            </p>
            {!requestingChanges ? (
              <div className="form-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setRequestingChanges(true);
                    setError('');
                  }}
                >
                  <PaperPlaneTilt size={18} />
                  Pedir cambios
                </button>
                <button className="btn btn-primary" onClick={() => review('approve')}>
                  <Check size={18} />
                  Confirmar proyecto
                </button>
              </div>
            ) : (
              <div>
                <div className="field">
                  <label htmlFor="review-feedback">¿Qué necesita ajustar el equipo?</label>
                  <textarea
                    id="review-feedback"
                    rows={3}
                    maxLength={600}
                    value={feedback}
                    onChange={(event) => {
                      setFeedback(event.target.value);
                      setFeedbackTouched(true);
                      setError('');
                    }}
                    aria-invalid={feedbackTouched && !!feedbackError}
                    aria-describedby="review-feedback-help"
                    autoFocus
                  />
                  <small
                    id="review-feedback-help"
                    className={feedbackTouched && feedbackError ? 'field-error' : 'muted'}
                  >
                    {feedbackTouched && feedbackError
                      ? feedbackError
                      : `${feedback.length}/600 caracteres. La devolución se muestra al estudiante.`}
                  </small>
                </div>
                <div className="form-actions">
                  <button className="btn btn-secondary" onClick={() => setRequestingChanges(false)}>
                    Cancelar
                  </button>
                  <button className="btn btn-primary" onClick={() => review('changes')}>
                    <PaperPlaneTilt size={18} />
                    Enviar devolución
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
        {assignedTeacher && project.status === 'approved' && (
          <p className="approved-note">
            <CheckCircle size={20} />
            Este proyecto ya está confirmado.
          </p>
        )}
        {role === 'admin' && project.status === 'approved' && (
          <section className="detail-section">
            <h3>Gestionar confirmación</h3>
            {reopening ? (
              <div className="inline-confirm">
                <p>
                  ¿Querés reabrir el proyecto? Se liberará su mesa y el estudiante deberá revisar y
                  reenviar la propuesta. Primero deben devolverse todos sus préstamos pendientes.
                </p>
                <div>
                  <button className="btn btn-secondary" onClick={() => setReopening(false)}>
                    Cancelar
                  </button>
                  <button className="btn btn-primary" onClick={() => review('reopen')}>
                    Sí, reabrir
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setReopening(true);
                  setError('');
                }}
              >
                <ArrowCounterClockwise size={18} />
                Reabrir proyecto
              </button>
            )}
          </section>
        )}
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </>
  );
}
