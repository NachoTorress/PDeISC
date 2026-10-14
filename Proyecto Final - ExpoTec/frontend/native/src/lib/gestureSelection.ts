/** Adaptador nativo: Android no requiere cambiar la selección del documento. */
export function lockGestureSelection(onCancel?: () => void): () => void {
  void onCancel;
  return () => {};
}
