/** Filas completas: tres opciones nunca se distribuyen como dos más una. */
export function choiceLayout(width: number, count: number) {
  const gap = 8;
  const capacity = Math.max(1, Math.floor((width + gap) / 152));
  let columns = Math.max(1, Math.min(count, capacity));
  while (count % columns !== 0) columns--;
  return {
    columns,
    optionWidth:
      width > 0 ? (width - gap * (columns - 1)) / columns : undefined,
  };
}
