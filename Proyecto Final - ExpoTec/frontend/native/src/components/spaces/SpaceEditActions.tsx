/** Botones del encabezado del plano: "Acomodar espacio" o, durante la edición, "Guardar" y "Descartar". */
import { View } from "react-native";
import { Button } from "../ui";
import type { SpaceDraft } from "../../lib/sharedSpaces";

/** true si el borrador tiene datos mínimos para guardarse. */
function savable(draft: SpaceDraft) {
  return (
    draft.space.name.trim().length >= 2 &&
    !draft.space.furniture.some(
      (item) => item.type === "label" && (item.text?.trim().length ?? 0) < 2,
    )
  );
}

export function SpaceEditActions({
  editing,
  busy,
  loading,
  onEdit,
  onSave,
  onDiscard,
}: {
  editing: SpaceDraft | null;
  busy: boolean;
  /** true mientras se consulta la lista o el plano. */
  loading: boolean;
  onEdit: () => void;
  onSave: () => void;
  onDiscard: () => void;
}) {
  if (!editing)
    return (
      <Button
        title="Acomodar espacio"
        icon="edit"
        variant="secondary"
        disabled={busy || loading}
        onPress={onEdit}
      />
    );
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      <Button
        title={busy ? "Guardando…" : "Guardar"}
        accessibilityLabel="Guardar plano"
        icon="save"
        style={{ flex: 1, minWidth: 0, paddingHorizontal: 8 }}
        disabled={busy || loading || !savable(editing)}
        onPress={onSave}
      />
      <Button
        title="Descartar"
        accessibilityLabel="Descartar borrador y recargar"
        variant="quiet"
        style={{ flex: 1, minWidth: 0, paddingHorizontal: 8 }}
        disabled={busy}
        onPress={onDiscard}
      />
    </View>
  );
}
