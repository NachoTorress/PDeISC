import { useLayoutEffect, useRef } from 'react';
import { PlugIcon, CheckIcon, ClockIcon, ArrowDownIcon } from '@phosphor-icons/react';
import type { Furniture, Project, Space } from '../lib/types';
import { TABLE_SIZE } from '../lib/layout';
import TableResizeHandles from './TableResizeHandles';

interface Props {
  space: Space;
  projects: Project[];
  editing: boolean;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onFit: (positions: { id: string; x: number; y: number }[]) => void;
  onResize: (id: string, geometry: { x: number; y: number; width: number; height: number }) => void;
}
interface Drag {
  id: string;
  node: HTMLButtonElement;
  x: number;
  y: number;
  pointerX: number;
  pointerY: number;
  originalX: number;
  originalY: number;
  moved: boolean;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

/** Usa la huella visible, incluido el giro, para conservar el elemento dentro del plano. */
function boundsFor(node: HTMLButtonElement, stage: HTMLDivElement) {
  const element = node.getBoundingClientRect();
  const plan = stage.getBoundingClientRect();
  const minX = Math.min(50, ((element.width / 2 + 2) / plan.width) * 100);
  const minY = Math.min(50, ((element.height / 2 + 2) / plan.height) * 100);
  return { minX, maxX: 100 - minX, minY, maxY: 100 - minY };
}

function fit(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** Mueve el mobiliario en el plano; solo persiste coordenadas al soltar. */
export default function Floorplan({
  space,
  projects,
  editing,
  selected,
  onSelect,
  onMove,
  onFit,
  onResize,
}: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const selectedTable = editing
    ? space.furniture.find((item) => item.id === selected && item.type === 'table')
    : undefined;

  useLayoutEffect(() => {
    const plan = stage.current;
    if (!plan) return;
    function keepInside() {
      const positions: { id: string; x: number; y: number }[] = [];
      plan!.querySelectorAll<HTMLButtonElement>('.furniture').forEach((node) => {
        const item = space.furniture.find((f) => f.id === node.dataset.furnitureId);
        if (!item) return;
        const bounds = boundsFor(node, plan!);
        const x = fit(item.x, bounds.minX, bounds.maxX);
        const y = fit(item.y, bounds.minY, bounds.maxY);
        node.style.left = `${x}%`;
        node.style.top = `${y}%`;
        if (Math.abs(item.x - x) > 0.01 || Math.abs(item.y - y) > 0.01)
          positions.push({ id: item.id, x, y });
      });
      if (editing && positions.length) onFit(positions);
    }
    keepInside();
    const observer = new ResizeObserver(keepInside);
    observer.observe(plan);
    return () => observer.disconnect();
  }, [space, editing, onFit]);
  function endDrag(cancelled = false) {
    const current = drag.current;
    if (!current) return;
    current.node.classList.remove('dragging');
    if (cancelled) {
      current.node.style.left = `${current.originalX}%`;
      current.node.style.top = `${current.originalY}%`;
    } else if (current.moved) {
      onMove(current.id, current.x, current.y);
      suppressClick.current = true;
    }
    drag.current = null;
  }
  function projectAt(item: Furniture) {
    return projects.find(
      (p) => p.spaceId === space.id && p.furnitureId === item.id && p.status === 'approved',
    );
  }
  return (
    <div
      className={`floorplan ${editing ? 'is-editing' : ''}`}
      ref={stage}
      aria-label={`Plano de ejemplo: ${space.name}`}
      onPointerDown={(event) => {
        if (editing && !(event.target as Element).closest('button')) onSelect(null);
      }}
    >
      <div className="plan-wall wall-top" />
      <div className="plan-wall wall-left" />
      <div className="plan-wall wall-right" />
      <div className="plan-wall wall-bottom" />
      <div className="plan-measure">
        <span>Distribución de ejemplo</span>
        <span>Vista superior</span>
      </div>
      <div className="walkway">
        <span>Circulación</span>
        <div />
      </div>
      {space.furniture.map((item) => {
        const width = item.width ?? TABLE_SIZE.width;
        const height = item.height ?? TABLE_SIZE.height;
        const project = projectAt(item);
        const pending =
          !project &&
          projects.some(
            (p) => p.spaceId === space.id && p.furnitureId === item.id && p.status === 'pending',
          );
        const label =
          item.type === 'table'
            ? `Puesto ${item.id}${project ? ` · ${project.name}` : pending ? ' · Solicitado' : ' · Disponible'}`
            : item.type === 'bench'
              ? 'Banco'
              : item.type === 'label'
                ? `Zona: ${item.text || 'Etiqueta sin texto'}`
                : 'Punto eléctrico de ejemplo';
        return (
          <button
            key={item.id}
            data-furniture-id={item.id}
            className={`furniture furniture-${item.type} ${project ? 'occupied' : pending ? 'requested' : 'available'} ${selected === item.id ? 'selected' : ''} ${item.type === 'table' && (width < 12 || height < 8) ? 'is-compact' : ''}`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: `translate(-50%,-50%) rotate(${item.rotation}deg)`,
              ...(item.type === 'table' ? { width: `${width}%`, height: `${height}%` } : {}),
            }}
            aria-label={label}
            title={label}
            aria-pressed={selected === item.id}
            onClick={() => {
              if (suppressClick.current) {
                suppressClick.current = false;
                return;
              }
              onSelect(item.id);
            }}
            onKeyDown={(event) => {
              if (
                !editing ||
                !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
              )
                return;
              event.preventDefault();
              const bounds = boundsFor(event.currentTarget, stage.current!);
              onMove(
                item.id,
                fit(
                  item.x + (event.key === 'ArrowRight' ? 2 : event.key === 'ArrowLeft' ? -2 : 0),
                  Math.max(6, bounds.minX),
                  Math.min(94, bounds.maxX),
                ),
                fit(
                  item.y + (event.key === 'ArrowDown' ? 2 : event.key === 'ArrowUp' ? -2 : 0),
                  Math.max(12, bounds.minY),
                  Math.min(88, bounds.maxY),
                ),
              );
            }}
            onPointerDown={(event) => {
              if (!editing || event.button !== 0) return;
              onSelect(item.id);
              event.currentTarget.setPointerCapture(event.pointerId);
              const current: Drag = {
                id: item.id,
                node: event.currentTarget,
                x: item.x,
                y: item.y,
                originalX: item.x,
                originalY: item.y,
                pointerX: event.clientX,
                pointerY: event.clientY,
                moved: false,
                bounds: boundsFor(event.currentTarget, stage.current!),
              };
              drag.current = current;
              current.node.classList.add('dragging');
            }}
            onPointerMove={(event) => {
              const current = drag.current;
              if (!current || !stage.current) return;
              const rect = stage.current.getBoundingClientRect();
              current.x = fit(
                current.originalX + ((event.clientX - current.pointerX) / rect.width) * 100,
                Math.max(6, current.bounds.minX),
                Math.min(94, current.bounds.maxX),
              );
              current.y = fit(
                current.originalY + ((event.clientY - current.pointerY) / rect.height) * 100,
                Math.max(12, current.bounds.minY),
                Math.min(88, current.bounds.maxY),
              );
              current.moved =
                Math.abs(current.x - current.originalX) + Math.abs(current.y - current.originalY) >
                0.5;
              current.node.style.left = `${current.x}%`;
              current.node.style.top = `${current.y}%`;
            }}
            onPointerUp={() => endDrag()}
            onPointerCancel={() => endDrag(true)}
          >
            {item.type === 'table' ? (
              <>
                <span className="table-code">
                  {item.id}
                  {project ? (
                    <CheckIcon size={13} weight="bold" />
                  ) : pending ? (
                    <ClockIcon size={13} />
                  ) : (
                    <span className="free-dot" />
                  )}
                </span>
                <span className="table-name">
                  {project?.name || (pending ? 'Solicitado' : 'Disponible')}
                </span>
                <span className="table-leg left-leg" />
                <span className="table-leg right-leg" />
              </>
            ) : item.type === 'power' ? (
              <PlugIcon size={23} weight="duotone" />
            ) : item.type === 'label' ? (
              <span className="zone-label-text">{item.text || 'Etiqueta sin texto'}</span>
            ) : (
              <span className="bench-label">Banco</span>
            )}
          </button>
        );
      })}
      {selectedTable && (
        <TableResizeHandles item={selectedTable} stage={stage} onResize={onResize} />
      )}
      <div className="plan-entrance">
        <ArrowDownIcon size={17} /> Entrada
      </div>
    </div>
  );
}
