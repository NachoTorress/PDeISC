/** Evita la selección azul únicamente durante el gesto. No cambia estilos ni bloquea los campos editables. */
export function lockGestureSelection(onCancel?: () => void): () => void {
  const isEditable = (target: EventTarget | null) =>
    target instanceof Element &&
    Boolean(target.closest('input, textarea, [contenteditable="true"]'));
  const preventSelection = (event: Event) => {
    if (!isEditable(event.target)) event.preventDefault();
  };
  const cancel = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel?.();
    }
  };
  const loseFocus = () => onCancel?.();
  const hide = () => {
    if (document.hidden) onCancel?.();
  };
  const capture = { capture: true };
  document.getSelection()?.removeAllRanges();
  document.addEventListener("selectstart", preventSelection, capture);
  document.addEventListener("dragstart", preventSelection, capture);
  document.addEventListener("keydown", cancel, capture);
  document.addEventListener("visibilitychange", hide);
  window.addEventListener("blur", loseFocus);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    document.removeEventListener("selectstart", preventSelection, capture);
    document.removeEventListener("dragstart", preventSelection, capture);
    document.removeEventListener("keydown", cancel, capture);
    document.removeEventListener("visibilitychange", hide);
    window.removeEventListener("blur", loseFocus);
  };
}
