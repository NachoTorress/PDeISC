/**
 * Paso 3 de la propuesta: elegir espacio y puesto (con disponibilidad
 * actualizable) y, de forma opcional, pedir elementos de la escuela.
 * Solicitar un puesto no lo reserva: lo confirma el profesor.
 */
import { ActivityIndicator, Text, View } from "react-native";
import { Button, Card, Choice, Heading, RefreshButton } from "../ui";
import SharedResourcePicker from "../SharedResourcePicker";
import { useTheme } from "../../contexts/ThemeContext";
import type { ProposalDraft } from "../../lib/sharedProjects";
import type { SharedSpace, SpaceSummary } from "../../lib/sharedSpaces";

export function ProposalPlaceStep({
  visible,
  draft,
  projectId,
  spaces,
  spaceId,
  space,
  spaceLoading,
  busy,
  resourcesOpen,
  onToggleResources,
  fieldError,
  onSpace,
  change,
  refreshPlaces,
}: {
  visible: boolean;
  draft: ProposalDraft;
  projectId?: string;
  spaces: SpaceSummary[];
  spaceId: string;
  space: SharedSpace | null;
  spaceLoading: boolean;
  busy: boolean;
  resourcesOpen: boolean;
  onToggleResources: () => void;
  fieldError: (key: string) => string | undefined;
  /** Cambia de espacio (el puesto elegido se borra). */
  onSpace: (id: string) => void;
  change: <K extends keyof ProposalDraft>(
    key: K,
    value: ProposalDraft[K],
  ) => void;
  refreshPlaces: () => Promise<void>;
}) {
  const { colors } = useTheme();
  const paragraph = { color: colors.muted, fontSize: 14, lineHeight: 21 };
  return (
    <View
      testID="proposal-step-place"
      style={{ display: visible ? "flex" : "none", gap: 16 }}
    >
      <Card>
        <Heading
          title="Elegí dónde presentar"
          subtitle="Solicitar un puesto todavía no lo reserva. Un profesor confirmará la propuesta."
        />
        <RefreshButton
          label="Actualizar puestos"
          loading={spaceLoading}
          disabled={spaceLoading || busy}
          onPress={() => void refreshPlaces()}
        />
        {spaces.length ? (
          <Choice
            label="Espacio"
            value={spaceId}
            options={spaces.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            disabled={busy}
            onChange={onSpace}
          />
        ) : (
          <Text style={paragraph}>
            La organización todavía no cargó espacios. El borrador se conserva;
            actualizá los puestos para volver a consultar.
          </Text>
        )}
        {spaceLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          space && (
            <Choice
              label="Puesto"
              value={draft.boothId}
              options={space.booths
                .filter(
                  (booth) => !booth.projectId || booth.projectId === projectId,
                )
                .map((booth) => ({
                  value: booth.id,
                  label: `Puesto ${booth.furnitureId}`,
                }))}
              disabled={busy}
              onChange={(id) => change("boothId", id)}
            />
          )
        )}
        {!!fieldError("boothId") && (
          <Text accessibilityRole="alert" style={{ color: colors.error }}>
            {fieldError("boothId")}
          </Text>
        )}
        {space &&
          !spaceLoading &&
          !space.booths.some(
            (booth) => !booth.projectId || booth.projectId === projectId,
          ) && (
            <Text style={paragraph}>
              No quedan puestos disponibles en este espacio. Elegí otro espacio
              o actualizá la disponibilidad.
            </Text>
          )}
      </Card>
      <Button
        title={
          resourcesOpen
            ? "Ocultar elementos solicitados"
            : draft.resources.length
              ? `Ver elementos solicitados (${draft.resources.length})`
              : "¿Necesitan elementos de la escuela? (opcional)"
        }
        variant="secondary"
        endIcon={resourcesOpen ? "chevronUp" : "chevronDown"}
        disabled={busy}
        onPress={onToggleResources}
      />
      <View
        style={{
          display: resourcesOpen || !!fieldError("resources") ? "flex" : "none",
        }}
      >
        <SharedResourcePicker
          requests={draft.resources}
          disabled={busy}
          error={fieldError("resources")}
          onChange={(resources) => change("resources", resources)}
        />
      </View>
    </View>
  );
}
