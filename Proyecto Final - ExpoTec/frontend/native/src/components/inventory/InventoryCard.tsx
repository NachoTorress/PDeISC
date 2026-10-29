/**
 * Tarjeta de un elemento del inventario: existencias (total, reservadas, para
 * reservar), unidades prestadas y fuera de servicio, faltantes, fecha de alta
 * y acciones (editar, dar de baja con confirmación en la tarjeta, historial).
 */
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { ActionRow, Button, Card, InlineConfirm } from "../ui";
import { useTheme } from "../../contexts/ThemeContext";
import { formatDate } from "../../lib/format";
import type { InventoryResource } from "../../lib/sharedInventory";

export function InventoryCard({
  resource,
  canManage,
  busy,
  locked,
  archiving,
  onEdit,
  onArchive,
  onCancelArchive,
  onConfirmArchive,
  onHistory,
  children,
}: {
  resource: InventoryResource;
  /** true para administración: puede editar y dar de baja. */
  canManage: boolean;
  busy: boolean;
  /** true mientras hay otro formulario abierto. */
  locked: boolean;
  /** true si se está confirmando la baja de este elemento. */
  archiving: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onCancelArchive: () => void;
  onConfirmArchive: () => void;
  onHistory: () => void;
  /** Contenido extra al pie (por ejemplo, el historial abierto). */
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  const paragraph = { color: colors.muted, lineHeight: 22 };
  return (
    <Card
      key={resource.id}
      testID={`inventory-card-${resource.id}`}
      style={{ flex: 1, padding: 16, gap: 10 }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: 18,
          lineHeight: 24,
          fontWeight: "600",
        }}
      >
        {resource.name}
      </Text>
      {!!resource.description && (
        <Text style={{ ...paragraph, fontSize: 14, lineHeight: 20 }}>
          {resource.description}
        </Text>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {[
          { label: "Total", value: resource.total, ink: colors.text },
          {
            label: "Reservadas",
            value: resource.reserved,
            ink: colors.text,
          },
          {
            label: "Para reservar",
            value: resource.available,
            ink: colors.success,
          },
        ].map((stat) => (
          <View key={stat.label} style={{ flex: 1, minWidth: 64, gap: 2 }}>
            <Text
              style={{
                color: stat.ink,
                fontSize: 20,
                lineHeight: 25,
                fontWeight: "600",
              }}
            >
              {stat.value}
            </Text>
            <Text
              style={{
                color: colors.muted,
                fontSize: 12,
                lineHeight: 17,
              }}
            >
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
      <Text style={{ ...paragraph, fontSize: 13, lineHeight: 19 }}>
        Sin devolver: {resource.outstanding} · Para entregar:{" "}
        {resource.availableToLend} · Fuera de servicio: {resource.unavailable}
      </Text>
      {resource.shortage > 0 && (
        <Text style={{ color: colors.error, lineHeight: 22 }}>
          Faltan {resource.shortage} unidades utilizables para cubrir las
          reservas. Revisá el estado o las existencias.
        </Text>
      )}
      <Text style={{ ...paragraph, fontSize: 13, lineHeight: 19 }}>
        Creado el {formatDate(resource.createdAt)}
        {resource.archivedAt
          ? ` · Baja el ${formatDate(resource.archivedAt)}`
          : ""}
      </Text>
      <ActionRow compact footer>
        {canManage && !resource.archivedAt && (
          <>
            <Button
              title="Editar"
              style={{ minWidth: 100 }}
              accessibilityLabel={`Editar ${resource.name}`}
              icon="edit"
              variant="secondary"
              disabled={busy || locked}
              onPress={onEdit}
            />
            <Button
              title="Dar de baja"
              accessibilityLabel={`Dar de baja ${resource.name}`}
              icon="trash"
              variant="danger"
              disabled={busy || locked}
              onPress={onArchive}
            />
          </>
        )}
        <Button
          title="Ver historial"
          accessibilityLabel={`Ver historial de ${resource.name}`}
          variant="quiet"
          disabled={busy || locked}
          onPress={onHistory}
        />
      </ActionRow>
      {archiving && (
        <View pointerEvents={busy ? "none" : "auto"}>
          <InlineConfirm
            text={`¿Dar de baja ${resource.name}? Se conservará su historial. Los proyectos vigentes deben quitarlo de sus pedidos antes de la baja.`}
            confirmLabel={busy ? "Guardando baja…" : "Sí, dar de baja"}
            onCancel={onCancelArchive}
            onConfirm={onConfirmArchive}
          />
        </View>
      )}
      {children}
    </Card>
  );
}
