/**
 * Pantalla del sistema compartido (datos de la API). Espacios y plano
 * compartido: consulta pública y, para administración, edición de mobiliario
 * y puestos.
 *
 * El estado y las llamadas a la API están en el hook `useSharedSpaces`; las
 * tarjetas están en `components/spaces/`.
 */
import {
  ActivityIndicator,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Button,
  Card,
  Choice,
  Heading,
  InlineConfirm,
  Screen,
  RefreshButton,
  PageHeading,
} from "../components/ui";
import NativeFloorplan from "../components/NativeFloorplan";
import NativeSpaceEditor from "../components/NativeSpaceEditor";
import { NewSpaceForm } from "../components/spaces/NewSpaceForm";
import { BoothToggleCard } from "../components/spaces/BoothToggleCard";
import { SpaceDetailsCard } from "../components/spaces/SpaceDetailsCard";
import { SpaceEditActions } from "../components/spaces/SpaceEditActions";
import { useTheme } from "../contexts/ThemeContext";
import { useSharedSpaces } from "../hooks/useSharedSpaces";

/** Plano del espacio elegido con su editor. */
export default function SharedSpacesPage({
  onSelectProject,
}: {
  onSelectProject: (id: string) => void;
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const view = useSharedSpaces();
  const { editing, space, spaces, busy, loading, canEdit, chosen, confirm } =
    view;
  const paragraph = { color: colors.muted, fontSize: 15, lineHeight: 22 };
  const wide = width >= 900;
  return (
    <Screen scrollEnabled={!view.gestureActive}>
      {!editing && (
        <PageHeading
          icon="map"
          title="Espacios de ExpoTec"
          subtitle="Planos compartidos de la exposición"
        />
      )}
      {!editing && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <RefreshButton
            label="Actualizar espacios"
            loading={loading}
            disabled={busy || loading}
            onPress={() => {
              view.setConfirm(null);
              void view.reload();
            }}
          />
          {canEdit && (
            <Button
              title={view.adding ? "Cancelar nuevo espacio" : "Nuevo espacio"}
              icon={view.adding ? "close" : "plus"}
              disabled={busy || loading}
              onPress={view.toggleAdding}
            />
          )}
        </View>
      )}
      {!!view.error && (
        <Text
          accessibilityRole="alert"
          style={{ ...paragraph, color: colors.error }}
        >
          {view.error}
          {space ? " Los datos visibles pueden estar desactualizados." : ""}
        </Text>
      )}
      {!!view.notice && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ ...paragraph, color: colors.success }}
        >
          {view.notice}
        </Text>
      )}
      {view.adding && canEdit && (
        <NewSpaceForm busy={busy} onCreate={view.create} />
      )}
      {loading && spaces === null ? (
        <ActivityIndicator color={colors.primary} />
      ) : spaces?.length === 0 ? (
        <Card>
          <Heading title="Todavía no hay espacios cargados" />
          <Text style={paragraph}>
            {canEdit
              ? "Creá un aula, patio o taller para empezar a organizar la exposición."
              : "La organización todavía no publicó la distribución de la exposición."}
          </Text>
        </Card>
      ) : null}
      {!!spaces?.length && !editing && (
        <Choice
          label="Elegir espacio"
          value={view.spaceId ?? ""}
          options={spaces.map((item) => ({
            value: item.id,
            label: `${item.name} · ${item.boothCount} ${item.boothCount === 1 ? "puesto" : "puestos"}`,
          }))}
          disabled={busy || loading}
          onChange={view.chooseSpace}
        />
      )}
      {view.detailLoading && !editing && (
        <ActivityIndicator color={colors.primary} />
      )}
      {space && (
        <View
          style={{
            flexDirection: wide ? "row" : "column",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          <Card style={wide ? { flex: 1, minWidth: 0 } : undefined}>
            <Heading
              title={space.name}
              subtitle={editing ? undefined : space.description || undefined}
            />
            {canEdit && (
              <SpaceEditActions
                editing={editing}
                busy={busy}
                loading={loading || view.detailLoading}
                onEdit={view.startEditing}
                onSave={view.save}
                onDiscard={() => view.setConfirm("discard")}
              />
            )}
            <View pointerEvents={busy ? "none" : "auto"}>
              <NativeFloorplan
                space={space}
                projects={[]}
                shared
                boothFurnitureIds={view.boothIds}
                occupiedBooths={view.occupied}
                editing={!!editing}
                showPending={false}
                selected={view.selected}
                onSelect={view.setSelected}
                onFit={view.fit}
                onGestureActiveChange={view.setGestureActive}
                onAddFurniture={view.addFurniture}
                onMove={(id, x, y) => view.updateFurniture(id, { x, y })}
                onResize={(id, geometry) => view.updateFurniture(id, geometry)}
              />
            </View>
          </Card>
          <View
            style={{ width: wide ? 300 : "100%", gap: 12 }}
            pointerEvents={busy ? "none" : "auto"}
          >
            {editing ? (
              <>
                <NativeSpaceEditor
                  space={editing.space}
                  selected={view.selected}
                  protectedFurnitureIds={view.occupied.map(
                    (booth) => booth.furnitureId,
                  )}
                  onSelect={view.setSelected}
                  onChange={view.changeSpace}
                />
                {chosen?.type === "table" && (
                  <BoothToggleCard
                    enabled={view.boothIds.includes(chosen.id)}
                    onChange={view.toggleBooth}
                  />
                )}
              </>
            ) : (
              <SpaceDetailsCard
                space={space}
                chosen={chosen}
                chosenBooth={view.chosenBooth}
                boothIds={view.boothIds}
                canEdit={canEdit}
                busy={busy}
                onSelectProject={onSelectProject}
                onArchive={() => view.setConfirm("archive")}
              />
            )}
            {confirm && (
              <InlineConfirm
                text={
                  confirm === "discard"
                    ? "¿Descartar los cambios del borrador y cargar el plano guardado?"
                    : `¿Dar de baja ${space.name}? Dejará de aparecer en la consulta pública y se conservarán sus registros.`
                }
                confirmLabel={
                  confirm === "discard" ? "Descartar y recargar" : "Dar de baja"
                }
                onCancel={() => view.setConfirm(null)}
                onConfirm={view.confirmAction}
              />
            )}
          </View>
        </View>
      )}
    </Screen>
  );
}
