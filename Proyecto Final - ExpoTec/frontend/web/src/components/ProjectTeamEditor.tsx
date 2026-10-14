import { useEffect, useRef, useState } from 'react';
import { Plus, Trash } from '@phosphor-icons/react';
import { memberKey, teamErrors } from '../lib/team';

type Props = {
  members: string[];
  onChange: (members: string[]) => void;
  creator: string;
  currentStudent: string;
  submitAttempt: boolean;
};

/** Edita el equipo del formulario; preserva al creador y al alumno que está editando. */
export default function ProjectTeamEditor({
  members,
  onChange,
  creator,
  currentStudent,
  submitAttempt,
}: Props) {
  const [touched, setTouched] = useState<Record<number, boolean>>({});
  const [removing, setRemoving] = useState<number>();
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const focusNewMember = useRef(false);
  const errors = teamErrors(members);
  const protectedIndices = [creator, currentStudent].map((name) =>
    members.findIndex((member) => memberKey(member) === memberKey(name)),
  );

  useEffect(() => {
    if (focusNewMember.current) {
      inputs.current[members.length - 1]?.focus();
      focusNewMember.current = false;
    }
  }, [members.length]);

  const addMember = () => {
    focusNewMember.current = true;
    setTouched((current) => ({ ...current, [members.length]: true }));
    setRemoving(undefined);
    onChange([...members, '']);
  };

  const removeMember = (index: number) => {
    onChange(members.filter((_, memberIndex) => memberIndex !== index));
    setTouched(
      Object.fromEntries(
        Object.entries(touched)
          .filter(([key]) => Number(key) !== index)
          .map(([key, value]) => [Number(key) > index ? Number(key) - 1 : Number(key), value]),
      ),
    );
    setRemoving(undefined);
    inputs.current[Math.max(0, index - 1)]?.focus();
  };

  return (
    <section className="form-section team-editor" aria-labelledby="project-team-title">
      <h3 id="project-team-title">Integrantes del equipo</h3>
      <p className="muted">Agregá a todas las personas que participan del proyecto.</p>
      {members.map((member, index) => {
        const protectedMember = protectedIndices.includes(index);
        const isCreator = memberKey(member) === memberKey(creator);
        const error = touched[index] || submitAttempt ? errors[index] : '';
        const helpId = `project-member-help-${index}`;
        return (
          <div className="team-member-row" key={index}>
            <div className="field team-member-input">
              <label htmlFor={`project-member-${index}`}>
                Nombre y apellido del integrante {index + 1}
              </label>
              <input
                id={`project-member-${index}`}
                ref={(element) => {
                  inputs.current[index] = element;
                }}
                value={member}
                maxLength={100}
                readOnly={protectedMember}
                autoComplete="name"
                onChange={(event) => {
                  onChange(
                    members.map((name, memberIndex) =>
                      memberIndex === index ? event.target.value : name,
                    ),
                  );
                  setTouched((current) => ({ ...current, [index]: true }));
                }}
                onBlur={() => setTouched((current) => ({ ...current, [index]: true }))}
                aria-invalid={!!error}
                aria-describedby={helpId}
              />
              <small id={helpId} className={error ? 'field-error' : 'muted'}>
                {error ||
                  (protectedMember
                    ? isCreator
                      ? 'Creador del proyecto. Su participación debe permanecer en el equipo.'
                      : 'Tu participación debe permanecer en el equipo mientras lo editás.'
                    : 'Usá letras, espacios y apóstrofes. Incluí nombre y apellido.')}
              </small>
            </div>
            {!protectedMember && removing !== index && (
              <div className="team-member-actions">
                <button
                  type="button"
                  className="btn btn-quiet danger"
                  aria-label={`Quitar integrante ${index + 1}${member.trim() ? `: ${member.trim()}` : ''}`}
                  onClick={() => setRemoving(index)}
                >
                  <Trash size={16} />
                  Quitar
                </button>
              </div>
            )}
            {removing === index && (
              <div className="inline-confirm">
                <p>
                  ¿Estás seguro de que querés quitar{' '}
                  {member.trim() ? `a ${member.trim()}` : `al integrante ${index + 1}`} del equipo?
                </p>
                <div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setRemoving(undefined)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary danger"
                    onClick={() => removeMember(index)}
                  >
                    Sí, quitar
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <button type="button" className="btn btn-secondary" onClick={addMember}>
        <Plus size={18} />
        Agregar integrante
      </button>
    </section>
  );
}
