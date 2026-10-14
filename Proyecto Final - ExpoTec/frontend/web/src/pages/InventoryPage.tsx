import { Fragment, useState } from 'react';
import type { FormEvent } from 'react';
import { Cube, MagnifyingGlass, PencilSimple, Plus, Trash, X } from '@phosphor-icons/react';
import { useDemo } from '../hooks/useDemo';
import { formatDate } from '../lib/format';
import { resourceUsed } from '../lib/model';
import type { Resource } from '../lib/types';

/** Permite crear y editar stock sin reducirlo por debajo de lo reservado o prestado. */
function ResourceForm({ resource, onClose }: { resource?: Resource; onClose: () => void }) {
  const { state, mutate, notify } = useDemo();
  const [name, setName] = useState(resource?.name ?? '');
  const [total, setTotal] = useState(resource ? String(resource.total) : '1');
  const [error, setError] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const assigned = resource ? resourceUsed(state, resource.id) : 0;
  const out = resource
    ? state.loans
        .filter((loan) => loan.resourceId === resource.id)
        .reduce((sum, loan) => sum + loan.quantity - loan.returned, 0)
    : 0;
  const minimum = Math.max(assigned, out);
  const normalizedName = name.trim();
  const invalidName =
    normalizedName.length < 2
      ? 'El nombre debe tener al menos 2 caracteres.'
      : normalizedName.length > 80
        ? 'El nombre puede tener hasta 80 caracteres.'
        : state.resources.some(
              (item) =>
                item.id !== resource?.id &&
                item.name.toLocaleLowerCase('es') === normalizedName.toLocaleLowerCase('es'),
            )
          ? 'Ya existe un elemento con ese nombre.'
          : '';
  const invalidTotal =
    !/^\d+$/.test(total) || !Number.isSafeInteger(Number(total))
      ? 'Ingresá un número entero igual o mayor que cero.'
      : Number(total) < minimum
        ? `El total no puede ser menor que ${minimum}: hay elementos asignados o sin devolver.`
        : '';

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNameTouched(true);
    if (invalidName || invalidTotal) return;
    const createdAt = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(new Date());
    const result = mutate({
      type: 'saveResource',
      resource: {
        id: resource?.id ?? crypto.randomUUID(),
        name: normalizedName,
        total: Number(total),
        createdAt: resource?.createdAt ?? createdAt,
      },
    });
    if (result) {
      setError(result);
      return;
    }
    notify(resource ? 'Elemento actualizado.' : 'Elemento agregado al inventario.');
    onClose();
  }

  return (
    <form
      className="inline-confirm"
      onSubmit={submit}
      noValidate
      aria-label={resource ? `Editar ${resource.name}` : 'Agregar elemento'}
    >
      <div className="section-heading">
        <h3>{resource ? 'Editar elemento' : 'Agregar elemento'}</h3>
        <button
          className="btn btn-quiet"
          type="button"
          onClick={onClose}
          aria-label="Cerrar edición"
        >
          <X size={18} />
        </button>
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor={`resource-name-${resource?.id ?? 'new'}`}>Nombre del elemento</label>
          <input
            id={`resource-name-${resource?.id ?? 'new'}`}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setNameTouched(true);
              setError('');
            }}
            onBlur={() => setNameTouched(true)}
            aria-invalid={nameTouched && Boolean(invalidName)}
            aria-describedby={
              nameTouched && invalidName
                ? `resource-name-error-${resource?.id ?? 'new'}`
                : undefined
            }
            autoFocus
          />
          {nameTouched && invalidName && (
            <small id={`resource-name-error-${resource?.id ?? 'new'}`} className="field-error">
              {invalidName}
            </small>
          )}
        </div>
        <div className="field">
          <label htmlFor={`resource-total-${resource?.id ?? 'new'}`}>Cantidad total</label>
          <input
            id={`resource-total-${resource?.id ?? 'new'}`}
            type="text"
            inputMode="numeric"
            value={total}
            onChange={(event) => {
              setTotal(event.target.value);
              setError('');
            }}
            aria-invalid={Boolean(invalidTotal)}
            aria-describedby={`resource-total-help-${resource?.id ?? 'new'}`}
          />
          <small
            id={`resource-total-help-${resource?.id ?? 'new'}`}
            className={invalidTotal ? 'field-error' : 'muted'}
          >
            {invalidTotal ||
              (minimum > 0
                ? `Mínimo actual: ${minimum} unidades.`
                : 'Ingresá cero si no hay unidades disponibles.')}
          </small>
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
          type="submit"
          disabled={Boolean(invalidName || invalidTotal)}
        >
          {resource ? 'Guardar cambios' : 'Agregar al inventario'}
        </button>
      </div>
    </form>
  );
}

export default function InventoryPage() {
  const { state, role, mutate, notify } = useDemo();
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const canManage = role === 'admin';
  const query = search.trim().toLocaleLowerCase('es');
  const resources = state.resources.filter((resource) =>
    resource.name.toLocaleLowerCase('es').includes(query),
  );
  const open = state.loans.reduce((sum, loan) => sum + loan.quantity - loan.returned, 0);

  function remove(resource: Resource) {
    const result = mutate({ type: 'deleteResource', id: resource.id });
    if (result) {
      setDeleteError(result);
      return;
    }
    setDeleteId(null);
    notify(`${resource.name} se eliminó del inventario.`);
  }

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>Inventario</h1>
          <p className="muted">
            Organizá los elementos antes de la muestra y seguí su disponibilidad.
          </p>
        </div>
        {canManage && !adding && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setAdding(true);
              setEditingId(null);
              setDeleteId(null);
            }}
          >
            <Plus size={20} /> Agregar elemento
          </button>
        )}
      </header>
      <div className="resource-summary">
        <p>
          <strong>{state.resources.length}</strong> tipos de elementos
        </p>
        <p>
          <strong>{open}</strong> unidades sin devolver
        </p>
        <p className="muted">El stock se reserva cuando un profesor confirma el proyecto.</p>
      </div>
      {!canManage && (
        <p className="muted">La administración puede agregar elementos y actualizar el stock.</p>
      )}
      {canManage && adding && <ResourceForm onClose={() => setAdding(false)} />}
      <section className="table-panel" aria-labelledby="inventory-title">
        <div className="section-heading">
          <h2 id="inventory-title">Elementos de ExpoTec</h2>
          <div className="field">
            <label htmlFor="inventory-search">Buscar elemento</label>
            <div className="search-field">
              <MagnifyingGlass size={19} aria-hidden="true" />
              <input
                id="inventory-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
        </div>
        {resources.length === 0 ? (
          <div className="empty-state">
            <Cube size={32} aria-hidden="true" />
            <h3>{query ? 'No encontramos ese elemento' : 'El inventario está vacío'}</h3>
            <p>
              {query
                ? 'Probá con otro nombre.'
                : 'Agregá los elementos que se van a prestar durante ExpoTec.'}
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
                Stock, asignaciones y préstamos de elementos
              </caption>
              <thead>
                <tr>
                  <th scope="col">Elemento</th>
                  <th scope="col">Total</th>
                  <th scope="col">Asignado</th>
                  <th scope="col">Disponible para asignar</th>
                  <th scope="col">Sin devolver</th>
                  <th scope="col">Creado</th>
                  {canManage && <th scope="col">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {resources.map((resource) => {
                  const used = resourceUsed(state, resource.id);
                  const out = state.loans
                    .filter((loan) => loan.resourceId === resource.id)
                    .reduce((sum, loan) => sum + loan.quantity - loan.returned, 0);
                  const hasHistory = state.loans.some((loan) => loan.resourceId === resource.id);
                  const requested = state.projects.some((project) =>
                    Object.hasOwn(project.resources, resource.id),
                  );
                  const canDelete = !hasHistory && !requested;
                  return (
                    <Fragment key={resource.id}>
                      <tr>
                        <td>
                          <strong>{resource.name}</strong>
                        </td>
                        <td>{resource.total}</td>
                        <td>{used}</td>
                        <td>
                          <strong>{Math.max(0, resource.total - used)}</strong>
                        </td>
                        <td>{out}</td>
                        <td>{formatDate(resource.createdAt)}</td>
                        {canManage && (
                          <td>
                            <div className="form-actions">
                              <button
                                className="btn btn-quiet"
                                onClick={() => {
                                  setEditingId(resource.id);
                                  setAdding(false);
                                  setDeleteId(null);
                                }}
                                aria-label={`Editar ${resource.name}`}
                              >
                                <PencilSimple size={18} /> Editar
                              </button>
                              {canDelete && (
                                <button
                                  className="btn btn-quiet"
                                  onClick={() => {
                                    setDeleteId(resource.id);
                                    setEditingId(null);
                                    setDeleteError('');
                                  }}
                                  aria-label={`Eliminar ${resource.name}`}
                                >
                                  <Trash size={18} />
                                </button>
                              )}
                            </div>
                            {!canDelete && (
                              <small className="meta">
                                {hasHistory
                                  ? 'Con historial de préstamos'
                                  : 'Solicitado por un proyecto'}
                              </small>
                            )}
                          </td>
                        )}
                      </tr>
                      {canManage && editingId === resource.id && (
                        <tr>
                          <td colSpan={7}>
                            <ResourceForm resource={resource} onClose={() => setEditingId(null)} />
                          </td>
                        </tr>
                      )}
                      {canManage && deleteId === resource.id && (
                        <tr>
                          <td colSpan={7}>
                            <div className="inline-confirm">
                              <h3>¿Querés eliminar {resource.name}?</h3>
                              <p className="muted">
                                Se quitará del inventario. Esta acción no se puede deshacer.
                              </p>
                              {deleteError && (
                                <p className="field-error" role="status">
                                  {deleteError}
                                </p>
                              )}
                              <div className="form-actions">
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => setDeleteId(null)}
                                >
                                  Cancelar
                                </button>
                                <button
                                  className="btn btn-primary"
                                  onClick={() => remove(resource)}
                                >
                                  <Trash size={18} /> Sí, eliminar
                                </button>
                              </div>
                            </div>
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
        <p className="meta">
          Disponible para asignar = stock total menos lo reservado por proyectos confirmados. “Sin
          devolver” suma todas las jornadas.
        </p>
      </section>
    </>
  );
}
