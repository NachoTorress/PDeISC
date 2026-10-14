import { useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  TableIcon,
  ArmchairIcon,
  PlugIcon,
  TagIcon,
  ArrowClockwiseIcon,
} from '@phosphor-icons/react';
import { useDemo } from '../hooks/useDemo';
import { TABLE_SIZE } from '../lib/layout';
import type { Furniture, Space } from '../lib/types';

export default function SpaceTools({
  space,
  selected,
  onChange,
  onSelect,
}: {
  space: Space;
  selected: string | null;
  onChange: (space: Space) => void;
  onSelect: (id: string | null) => void;
}) {
  const { state } = useDemo();
  const [confirm, setConfirm] = useState<string | null>(null);
  const current = space.furniture.find((f) => f.id === selected);
  const used =
    current && state.projects.some((p) => p.spaceId === space.id && p.furnitureId === current.id);
  const labelError =
    current?.type === 'label' && (current.text?.trim().length ?? 0) < 2
      ? 'Escribí al menos 2 caracteres para identificar la zona.'
      : '';
  function updateCurrent(changes: Partial<Furniture>) {
    if (!current) return;
    onChange({
      ...space,
      furniture: space.furniture.map((f) => (f.id === current.id ? { ...f, ...changes } : f)),
    });
  }
  function add(type: Furniture['type']) {
    const prefix = { table: 'M', bench: 'B', power: 'E', label: 'Z' }[type];
    const id = `${space.id.toUpperCase().slice(0, 2)}${prefix}${String(space.furniture.length + 1).padStart(2, '0')}-${Math.random().toString(36).slice(2, 4)}`;
    const furniture: Furniture = {
      id,
      type,
      x: 50,
      y: 38,
      rotation: 0,
      ...(type === 'table' ? TABLE_SIZE : {}),
      ...(type === 'label' ? { text: 'Nueva zona' } : {}),
    };
    onChange({ ...space, furniture: [...space.furniture, furniture] });
    onSelect(id);
  }
  return (
    <div className="space-tools">
      <h3>Acomodá el espacio</h3>
      <p className="muted">
        Seleccioná un elemento y arrastralo para moverlo. Para cambiar una mesa, arrastrá sus bordes
        o esquinas.
      </p>
      <p className="meta">
        Con el teclado, las flechas mueven el elemento. En un tirador, ajustan su tamaño.
      </p>
      <div className="tool-grid">
        <button className="tool-button" onClick={() => add('table')}>
          <TableIcon size={25} />
          <span>Mesa</span>
          <PlusIcon size={15} />
        </button>
        <button className="tool-button" onClick={() => add('bench')}>
          <ArmchairIcon size={25} />
          <span>Banco</span>
          <PlusIcon size={15} />
        </button>
        <button className="tool-button" onClick={() => add('power')}>
          <PlugIcon size={25} />
          <span>Punto eléctrico</span>
          <PlusIcon size={15} />
        </button>
        <button className="tool-button" onClick={() => add('label')}>
          <TagIcon size={25} />
          <span>Etiqueta</span>
          <PlusIcon size={15} />
        </button>
      </div>
      <div className="field">
        <label htmlFor="space-name">Nombre del espacio</label>
        <input
          id="space-name"
          value={space.name}
          onChange={(e) => onChange({ ...space, name: e.target.value })}
          maxLength={80}
          aria-invalid={!space.name.trim()}
        />
        {!space.name.trim() && <span className="field-error">El espacio necesita un nombre.</span>}
      </div>
      <div className="field">
        <label htmlFor="space-desc">Descripción</label>
        <input
          id="space-desc"
          value={space.description}
          onChange={(e) => onChange({ ...space, description: e.target.value })}
          maxLength={150}
        />
      </div>
      {current && (
        <div className="selected-tool">
          <div className="section-heading">
            <strong>
              {current.type === 'table'
                ? 'Mesa'
                : current.type === 'bench'
                  ? 'Banco'
                  : current.type === 'label'
                    ? 'Etiqueta'
                    : 'Punto eléctrico'}{' '}
              · {current.id}
            </strong>
            {current.type !== 'label' && (
              <button
                className="btn btn-quiet"
                onClick={() => updateCurrent({ rotation: (current.rotation + 90) % 360 })}
                aria-label="Girar elemento"
              >
                <ArrowClockwiseIcon size={19} />
              </button>
            )}
          </div>
          {current.type === 'label' && (
            <div className="field zone-label-field">
              <label htmlFor="zone-label-text">Texto de la etiqueta</label>
              <input
                id="zone-label-text"
                value={current.text ?? ''}
                onChange={(e) => updateCurrent({ text: e.target.value })}
                maxLength={60}
                aria-invalid={Boolean(labelError)}
                aria-describedby={labelError ? 'zone-label-error' : 'zone-label-hint'}
              />
              {labelError ? (
                <span className="field-error" id="zone-label-error" aria-live="polite">
                  {labelError}
                </span>
              ) : (
                <span className="meta" id="zone-label-hint">
                  Por ejemplo: Entrada, Robótica o Zona de descanso.
                </span>
              )}
            </div>
          )}
          {current.type === 'table' && (
            <p className="meta">
              Arrastrá los tiradores del plano para achicar o agrandar la mesa.
            </p>
          )}
          {used ? (
            <p className="meta">Este puesto tiene proyectos asociados y debe conservarse.</p>
          ) : confirm === current.id ? (
            <div className="inline-confirm">
              <p>¿Seguro que querés quitar este elemento del plano?</p>
              <button
                className="btn btn-danger"
                onClick={() => {
                  onChange({
                    ...space,
                    furniture: space.furniture.filter((f) => f.id !== current.id),
                  });
                  onSelect(null);
                  setConfirm(null);
                }}
              >
                Quitar elemento
              </button>
              <button className="btn btn-quiet" onClick={() => setConfirm(null)}>
                Conservar
              </button>
            </div>
          ) : (
            <button className="btn btn-quiet danger-text" onClick={() => setConfirm(current.id)}>
              <TrashIcon size={17} /> Quitar del plano
            </button>
          )}
        </div>
      )}
      <div className="electrical-note">
        <PlugIcon size={20} />
        <p>
          Los puntos eléctricos son referencias del plano. La instalación debe revisarla personal
          habilitado.
        </p>
      </div>
    </div>
  );
}
