import { useEffect, useLayoutEffect, useRef } from 'react';
import type { PointerEvent, RefObject } from 'react';
import type { Furniture } from '../lib/types';
import { TABLE_SIZE } from '../lib/layout';
import { resizeTable } from '../lib/resizeTable';
import type { ResizeHandle } from '../lib/resizeTable';

type Geometry = { x: number; y: number; width: number; height: number };
type Session = {
  original: Furniture;
  startX: number;
  startY: number;
  handle: ResizeHandle;
  size: { width: number; height: number };
  table: HTMLButtonElement;
  frame: HTMLDivElement;
  result: Geometry;
};

const handles: { handle: ResizeHandle; x: number; y: number }[] = [
  { handle: 'nw', x: -1, y: -1 },
  { handle: 'n', x: 0, y: -1 },
  { handle: 'ne', x: 1, y: -1 },
  { handle: 'e', x: 1, y: 0 },
  { handle: 'se', x: 1, y: 1 },
  { handle: 's', x: 0, y: 1 },
  { handle: 'sw', x: -1, y: 1 },
  { handle: 'w', x: -1, y: 0 },
];
const directions = [
  'borde derecho',
  'esquina inferior derecha',
  'borde inferior',
  'esquina inferior izquierda',
  'borde izquierdo',
  'esquina superior izquierda',
  'borde superior',
  'esquina superior derecha',
];
const cursors = ['ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize'];

function geometryOf(item: Furniture): Geometry {
  return {
    x: item.x,
    y: item.y,
    width: item.width ?? TABLE_SIZE.width,
    height: item.height ?? TABLE_SIZE.height,
  };
}

/** Actualiza la vista durante el gesto; el estado del plano se modifica una sola vez al soltar. */
function paint(session: Session, value: Geometry) {
  for (const node of [session.table, session.frame]) {
    node.style.left = `${value.x}%`;
    node.style.top = `${value.y}%`;
    node.style.width = `${value.width}%`;
    node.style.height = `${value.height}%`;
  }
  session.table.classList.toggle('is-compact', value.width < 12 || value.height < 8);
}

export default function TableResizeHandles({
  item,
  stage,
  onResize,
}: {
  item: Furniture;
  stage: RefObject<HTMLDivElement | null>;
  onResize: (id: string, geometry: Geometry) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const session = useRef<Session | null>(null);
  const value = geometryOf(item);

  useLayoutEffect(() => {
    const box = frame.current;
    const plan = stage.current;
    if (!box || !plan) return;
    function placeHandles() {
      const bounds = plan!.getBoundingClientRect();
      const angle = (item.rotation * Math.PI) / 180;
      const nodes = Array.from(box!.querySelectorAll<HTMLButtonElement>('.resize-handle'));
      nodes.forEach((node) => {
        node.style.marginLeft = '0px';
        node.style.marginTop = '0px';
      });
      const visible = nodes.filter((node) => node.offsetWidth);
      const rects = visible.map((node) => node.getBoundingClientRect());
      if (!rects.length) return;
      const left = Math.min(...rects.map((r) => r.left));
      const right = Math.max(...rects.map((r) => r.right));
      const top = Math.min(...rects.map((r) => r.top));
      const bottom = Math.max(...rects.map((r) => r.bottom));
      // Se conserva el grupo completo y su separación, incluida toda el área táctil de cada tirador.
      const dx =
        left < bounds.left + 2
          ? bounds.left + 2 - left
          : right > bounds.right - 2
            ? bounds.right - 2 - right
            : 0;
      const dy =
        top < bounds.top + 2
          ? bounds.top + 2 - top
          : bottom > bounds.bottom - 2
            ? bounds.bottom - 2 - bottom
            : 0;
      const localX = dx * Math.cos(angle) + dy * Math.sin(angle);
      const localY = -dx * Math.sin(angle) + dy * Math.cos(angle);
      visible.forEach((node) => {
        node.style.marginLeft = `${localX}px`;
        node.style.marginTop = `${localY}px`;
      });
      box!.style.setProperty('--handles-x', `${localX}px`);
      box!.style.setProperty('--handles-y', `${localY}px`);
    }
    placeHandles();
    const observer = new ResizeObserver(placeHandles);
    observer.observe(box);
    observer.observe(plan);
    return () => observer.disconnect();
  }, [item, stage]);

  useEffect(
    () => () => {
      const current = session.current;
      if (current) paint(current, geometryOf(current.original));
      session.current = null;
    },
    [item.id],
  );

  function end(cancelled = false) {
    const current = session.current;
    if (!current) return;
    current.frame.classList.remove('is-resizing');
    if (cancelled) paint(current, geometryOf(current.original));
    else onResize(current.original.id, current.result);
    session.current = null;
  }

  function begin(event: PointerEvent<HTMLButtonElement>, handle: ResizeHandle) {
    if (event.button !== 0 || !stage.current || !frame.current) return;
    event.preventDefault();
    event.stopPropagation();
    const table = Array.from(
      stage.current.querySelectorAll<HTMLButtonElement>('.furniture-table'),
    ).find((node) => node.dataset.furnitureId === item.id);
    if (!table) return;
    const rect = stage.current.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    // En mesas pequeñas, las áreas táctiles pueden cruzarse: se usa el tirador visible más cercano.
    const nearest = Array.from(frame.current.querySelectorAll<HTMLButtonElement>('.resize-handle'))
      .filter((node) => node.offsetWidth)
      .map((node) => {
        const r = node.getBoundingClientRect();
        return {
          handle: node.dataset.handle as ResizeHandle,
          distance: Math.hypot(
            event.clientX - r.left - r.width / 2,
            event.clientY - r.top - r.height / 2,
          ),
        };
      })
      .sort((a, b) => a.distance - b.distance)[0];
    session.current = {
      original: { ...item },
      startX: event.clientX,
      startY: event.clientY,
      handle: nearest?.handle ?? handle,
      size: { width: rect.width, height: rect.height },
      table,
      frame: frame.current,
      result: value,
    };
    frame.current.classList.add('is-resizing');
  }

  return (
    <div
      className="table-selection"
      ref={frame}
      role="group"
      aria-label={`Tamaño de la mesa ${item.id}`}
      style={{
        left: `${value.x}%`,
        top: `${value.y}%`,
        width: `${value.width}%`,
        height: `${value.height}%`,
        transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
      }}
    >
      <span id="table-resize-help" className="visually-hidden">
        Arrastrá un tirador para cambiar el tamaño. Con el teclado, usá las flechas; Shift hace un
        ajuste mayor. Escape cancela el arrastre.
      </span>
      {handles.map(({ handle, x, y }) => {
        const direction =
          ((Math.round((Math.atan2(y, x) + (item.rotation * Math.PI) / 180) / (Math.PI / 4)) % 8) +
            8) %
          8;
        return (
          <button
            key={handle}
            type="button"
            className={`resize-handle resize-${handle} ${x && y ? 'is-corner' : 'is-edge'}`}
            data-handle={handle}
            style={{ cursor: cursors[direction % 4] }}
            aria-label={`Cambiar tamaño de ${item.id}: ${directions[direction]}`}
            aria-describedby="table-resize-help"
            title={`Arrastrar ${directions[direction]}`}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => begin(event, handle)}
            onPointerMove={(event) => {
              const current = session.current;
              if (!current) return;
              current.result = resizeTable(
                current.original,
                current.handle,
                event.clientX - current.startX,
                event.clientY - current.startY,
                current.size,
              );
              paint(current, current.result);
            }}
            onPointerUp={() => end()}
            onPointerCancel={() => end(true)}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && session.current) {
                event.preventDefault();
                event.stopPropagation();
                end(true);
                return;
              }
              if (
                !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) ||
                !stage.current
              )
                return;
              event.preventDefault();
              event.stopPropagation();
              const step = event.shiftKey ? 10 : 2;
              const rect = stage.current.getBoundingClientRect();
              onResize(
                item.id,
                resizeTable(
                  item,
                  handle,
                  event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0,
                  event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0,
                  { width: rect.width, height: rect.height },
                ),
              );
            }}
          />
        );
      })}
    </div>
  );
}
