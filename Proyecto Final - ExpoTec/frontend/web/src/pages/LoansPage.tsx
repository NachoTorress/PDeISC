import { Fragment, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowUUpLeft, HandCoins, MagnifyingGlass, Plus, X } from '@phosphor-icons/react';
import { useDemo } from '../hooks/useDemo';
import { formatDate } from '../lib/format';
import { resourceOut } from '../lib/model';
import type { Loan } from '../lib/types';

const quantityError = (value: string, maximum: number) => {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1)
    return 'Ingresá una cantidad entera mayor que cero.';
  if (maximum === 0) return 'No quedan unidades disponibles para esta entrega.';
  if (Number(value) > maximum)
    return `Podés registrar hasta ${maximum} ${maximum === 1 ? 'unidad' : 'unidades'}.`;
  return '';
};

/** Registra una devolución parcial o total y conserva la observación en el préstamo. */
function ReturnForm({ loan, onClose }: { loan: Loan; onClose: () => void }) {
  const { mutate, notify } = useDemo();
  const remaining = loan.quantity - loan.returned;
  const [quantity, setQuantity] = useState(String(remaining));
  const [notes, setNotes] = useState(loan.notes);
  const [error, setError] = useState('');
  const invalidQuantity = quantityError(quantity, remaining);
  const invalidNotes = notes.length > 500 ? 'La observación puede tener hasta 500 caracteres.' : '';

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (invalidQuantity || invalidNotes) return;
    const result = mutate({
      type: 'returnLoan',
      id: loan.id,
      quantity: Number(quantity),
      notes: notes.trim(),
    });
    if (result) {
      setError(result);
      return;
    }
    notify(
      Number(quantity) === remaining
        ? 'Devolución completa registrada.'
        : 'Devolución parcial registrada.',
    );
    onClose();
  }

  return (
    <form className="inline-confirm" onSubmit={submit} noValidate aria-label="Registrar devolución">
      <div className="section-heading">
        <h3>Registrar devolución</h3>
        <button
          className="btn btn-quiet"
          type="button"
          onClick={onClose}
          aria-label="Cerrar devolución"
        >
          <X size={18} />
        </button>
      </div>
      <p className="muted">
        Quedan {remaining} {remaining === 1 ? 'unidad por devolver' : 'unidades por devolver'}.
        Podés registrar una devolución parcial.
      </p>
      <div className="form-grid">
        <div className="field">
          <label htmlFor={`return-quantity-${loan.id}`}>Cantidad devuelta</label>
          <input
            id={`return-quantity-${loan.id}`}
            type="text"
            inputMode="numeric"
            value={quantity}
            onChange={(event) => {
              setQuantity(event.target.value);
              setError('');
            }}
            aria-invalid={Boolean(invalidQuantity)}
            aria-describedby={invalidQuantity ? `return-quantity-error-${loan.id}` : undefined}
            autoFocus
          />
          {invalidQuantity && (
            <small id={`return-quantity-error-${loan.id}`} className="field-error">
              {invalidQuantity}
            </small>
          )}
        </div>
        <div className="field">
          <label htmlFor={`return-notes-${loan.id}`}>
            Observación <span className="muted">(opcional)</span>
          </label>
          <input
            id={`return-notes-${loan.id}`}
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              setError('');
            }}
            aria-invalid={Boolean(invalidNotes)}
            aria-describedby={invalidNotes ? `return-notes-error-${loan.id}` : undefined}
          />
          {invalidNotes && (
            <small id={`return-notes-error-${loan.id}`} className="field-error">
              {invalidNotes}
            </small>
          )}
        </div>
      </div>
      {error && (
        <p className="field-error" role="status">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn-secondary" type="button" onClick={onClose}>
          Cancelar
        </button>
        <button
          className="btn btn-primary"
          disabled={Boolean(invalidQuantity || invalidNotes)}
          type="submit"
        >
          <ArrowUUpLeft size={18} /> Registrar devolución
        </button>
      </div>
    </form>
  );
}

/** Selecciona un proyecto confirmado y entrega exclusivamente los elementos que tiene asignados. */
function LendingForm({ day, onClose }: { day: number; onClose: () => void }) {
  const { state, mutate, notify } = useDemo();
  const [projectId, setProjectId] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');
  const projects = state.projects.filter((project) => project.status === 'approved');
  const project = projects.find((item) => item.id === projectId);
  const resources = state.resources.filter((resource) => {
    const delivered = state.loans
      .filter(
        (loan) =>
          loan.projectId === projectId && loan.resourceId === resource.id && loan.day === day,
      )
      .reduce((sum, loan) => sum + loan.quantity, 0);
    return (project?.resources[resource.id] ?? 0) > delivered;
  });
  const resource = resources.find((item) => item.id === resourceId);
  const alreadyDelivered = state.loans
    .filter(
      (loan) => loan.projectId === projectId && loan.resourceId === resourceId && loan.day === day,
    )
    .reduce((sum, loan) => sum + loan.quantity, 0);
  const stockOut = state.loans
    .filter((loan) => loan.resourceId === resourceId)
    .reduce((sum, loan) => sum + loan.quantity - loan.returned, 0);
  const assignedRemaining = Math.max(0, (project?.resources[resourceId] ?? 0) - alreadyDelivered);
  const available = resource
    ? Math.max(0, Math.min(assignedRemaining, resource.total - stockOut))
    : 0;
  const earlierLoan = state.loans.some(
    (loan) =>
      loan.projectId === projectId &&
      loan.resourceId === resourceId &&
      loan.day !== day &&
      loan.quantity > loan.returned,
  );
  const invalidQuantity = resource ? quantityError(quantity, available) : '';

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || !resource || invalidQuantity || earlierLoan) return;
    const result = mutate({ type: 'lend', projectId, resourceId, day, quantity: Number(quantity) });
    if (result) {
      setError(result);
      return;
    }
    notify(`Entrega registrada para ${project.name}, día ${day}.`);
    onClose();
  }

  return (
    <form className="table-panel" onSubmit={submit} noValidate aria-label="Registrar entrega">
      <div className="section-heading">
        <h2>Registrar entrega · día {day}</h2>
        <button
          className="btn btn-quiet"
          type="button"
          onClick={onClose}
          aria-label="Cerrar nueva entrega"
        >
          <X size={18} />
        </button>
      </div>
      <p className="muted">Los elementos deben volver al finalizar cada jornada.</p>
      {projects.length === 0 ? (
        <div className="empty-state">
          Todavía no hay proyectos confirmados para recibir elementos.
        </div>
      ) : (
        <>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="loan-project">Proyecto confirmado</label>
              <select
                id="loan-project"
                value={projectId}
                onChange={(event) => {
                  setProjectId(event.target.value);
                  setResourceId('');
                  setQuantity('1');
                  setError('');
                }}
                autoFocus
              >
                <option value="">Elegí un proyecto</option>
                {projects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="loan-resource">Elemento asignado</label>
              <select
                id="loan-resource"
                value={resourceId}
                disabled={!project || resources.length === 0}
                onChange={(event) => {
                  setResourceId(event.target.value);
                  setQuantity('1');
                  setError('');
                }}
              >
                <option value="">
                  {project && resources.length === 0
                    ? 'No hay entregas pendientes para este proyecto'
                    : 'Elegí un elemento'}
                </option>
                {resources.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {project?.resources[item.id]} asignados
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="loan-quantity">Cantidad a entregar</label>
              <input
                id="loan-quantity"
                type="text"
                inputMode="numeric"
                value={quantity}
                disabled={!resource}
                onChange={(event) => {
                  setQuantity(event.target.value);
                  setError('');
                }}
                aria-invalid={Boolean(invalidQuantity)}
                aria-describedby="loan-quantity-help"
              />
              <small id="loan-quantity-help" className={invalidQuantity ? 'field-error' : 'muted'}>
                {invalidQuantity ||
                  (resource
                    ? `${available} disponibles para este proyecto en esta jornada.`
                    : 'Primero elegí el proyecto y el elemento.')}
              </small>
            </div>
          </div>
          {earlierLoan && (
            <p className="alert-note" role="status">
              Este proyecto todavía tiene este elemento de otra jornada. Registrá su devolución
              antes de volver a entregarlo.
            </p>
          )}
          {error && (
            <p className="field-error" role="status">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button className="btn btn-secondary" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={!project || !resource || Boolean(invalidQuantity) || earlierLoan}
            >
              <HandCoins size={18} /> Registrar entrega
            </button>
          </div>
        </>
      )}
    </form>
  );
}

export default function LoansPage() {
  const { state, role } = useDemo();
  const [day, setDay] = useState(1);
  const [search, setSearch] = useState('');
  const [lending, setLending] = useState(false);
  const [returnId, setReturnId] = useState<string | null>(null);
  const canManage = role === 'loans' || role === 'admin';
  const query = search.trim().toLocaleLowerCase('es');
  const dayLoans = state.loans.filter((loan) => loan.day === day);
  const loans = dayLoans.filter((loan) =>
    `${state.projects.find((project) => project.id === loan.projectId)?.name ?? ''} ${state.resources.find((resource) => resource.id === loan.resourceId)?.name ?? ''} ${loan.notes}`
      .toLocaleLowerCase('es')
      .includes(query),
  );
  const pending = state.resources.reduce(
    (sum, resource) => sum + resourceOut(state, resource.id, day),
    0,
  );
  const pendingLoans = dayLoans.filter((loan) => loan.quantity > loan.returned).length;
  const previousPending = state.loans
    .filter((loan) => loan.day < day)
    .reduce((sum, loan) => sum + loan.quantity - loan.returned, 0);

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>Préstamos</h1>
          <p className="muted">
            Cada entrega, cada devolución. Todo en su lugar al terminar el día.
          </p>
        </div>
        {canManage && !lending && (
          <button className="btn btn-primary" onClick={() => setLending(true)}>
            <Plus size={20} /> Registrar entrega
          </button>
        )}
      </header>
      <div className="toolbar">
        <div className="segment-control" aria-label="Jornada de ExpoTec">
          {[1, 2, 3].map((item) => (
            <button
              key={item}
              className={`segment-button ${day === item ? 'active' : ''}`}
              aria-pressed={day === item}
              onClick={() => {
                setDay(item);
                setReturnId(null);
              }}
            >
              Día {item}
            </button>
          ))}
        </div>
        <p className="meta">
          {pending} {pending === 1 ? 'elemento por devolver' : 'elementos por devolver'} ·{' '}
          {pendingLoans} {pendingLoans === 1 ? 'préstamo abierto' : 'préstamos abiertos'}
        </p>
      </div>
      {previousPending > 0 && (
        <p className="alert-note">
          Hay {previousPending}{' '}
          {previousPending === 1 ? 'elemento sin devolver' : 'elementos sin devolver'} de jornadas
          anteriores. Revisá las entregas antes de prestar de nuevo.
        </p>
      )}
      {!canManage && (
        <p className="muted">
          La entrega y la devolución están a cargo de quienes gestionan los préstamos.
        </p>
      )}
      {canManage && lending && (
        <LendingForm key={day} day={day} onClose={() => setLending(false)} />
      )}
      <section className="table-panel" aria-labelledby="loans-title">
        <div className="section-heading">
          <h2 id="loans-title">Movimientos del día {day}</h2>
          <div className="field">
            <label htmlFor="loan-search">Buscar proyecto o elemento</label>
            <div className="search-field">
              <MagnifyingGlass size={19} aria-hidden="true" />
              <input
                id="loan-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
        </div>
        {loans.length === 0 ? (
          <div className="empty-state">
            <HandCoins size={32} aria-hidden="true" />
            <h3>
              {query ? 'No encontramos esos movimientos' : 'Esta jornada todavía no tiene entregas'}
            </h3>
            <p>
              {query
                ? 'Probá con el nombre del proyecto o del elemento.'
                : 'Las entregas que registres aparecerán acá.'}
            </p>
            {query && (
              <button className="btn btn-secondary" onClick={() => setSearch('')}>
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <caption className="visually-hidden">
                Entregas y devoluciones de la jornada {day}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Proyecto</th>
                  <th scope="col">Elemento</th>
                  <th scope="col">Entregados</th>
                  <th scope="col">Por devolver</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Creado</th>
                  {canManage && <th scope="col">Acción</th>}
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => {
                  const project = state.projects.find((item) => item.id === loan.projectId);
                  const resource = state.resources.find((item) => item.id === loan.resourceId);
                  const remaining = loan.quantity - loan.returned;
                  const completed = remaining === 0;
                  return (
                    <Fragment key={loan.id}>
                      <tr>
                        <td>
                          <strong>{project?.name ?? 'Proyecto no disponible'}</strong>
                          <div className="meta">
                            {state.spaces.find((space) => space.id === project?.spaceId)?.name}{' '}
                            {project?.furnitureId && `· ${project.furnitureId}`}
                          </div>
                        </td>
                        <td>
                          {resource?.name ?? 'Elemento no disponible'}
                          {loan.notes && <div className="meta">{loan.notes}</div>}
                        </td>
                        <td>{loan.quantity}</td>
                        <td>
                          <strong>{remaining}</strong>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${completed ? 'status-approved' : loan.returned > 0 ? 'status-changes' : 'status-pending'}`}
                          >
                            {completed
                              ? 'Devuelto'
                              : loan.returned > 0
                                ? 'Devolución parcial'
                                : 'En préstamo'}
                          </span>
                        </td>
                        <td>{formatDate(loan.createdAt)}</td>
                        {canManage && (
                          <td>
                            {!completed && returnId !== loan.id && (
                              <button
                                className="btn btn-secondary"
                                onClick={() => setReturnId(loan.id)}
                              >
                                <ArrowUUpLeft size={17} /> Devolver
                              </button>
                            )}
                            {completed && <span className="muted">Completo</span>}
                          </td>
                        )}
                      </tr>
                      {canManage && returnId === loan.id && !completed && (
                        <tr>
                          <td colSpan={7}>
                            <ReturnForm loan={loan} onClose={() => setReturnId(null)} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
