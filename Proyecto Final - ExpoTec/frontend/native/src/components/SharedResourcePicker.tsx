import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Button, Card, Field, Heading, InlineConfirm } from "./ui";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { integerQuantity } from "../lib/sharedInventory";
import type {
  InventoryResource,
  ResourceRequestDraft,
} from "../lib/sharedInventory";

export default function SharedResourcePicker({
  requests,
  disabled,
  error,
  onChange,
}: {
  requests: ResourceRequestDraft[];
  disabled: boolean;
  error?: string;
  onChange: (requests: ResourceRequestDraft[]) => void;
}) {
  const { client, user } = useAuth();
  const { colors } = useTheme();
  const [catalog, setCatalog] = useState<InventoryResource[]>([]);
  const [loadedFor, setLoadedFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [remove, setRemove] = useState<string | null>(null);
  const revision = useRef(0);
  const scope = `${user?.id}:${user?.roles.join(",")}`;
  const load = useCallback(async () => {
    const request = ++revision.current;
    setLoading(true);
    setLoadError("");
    try {
      const result = await client.send<{ resources: InventoryResource[] }>(
        "/api/inventory/catalog/query",
        {},
      );
      if (request === revision.current) {
        setCatalog(result.resources);
        setLoadedFor(scope);
      }
    } catch (cause) {
      if (request === revision.current)
        setLoadError(
          cause instanceof Error
            ? cause.message
            : "No pudimos cargar los elementos.",
        );
    } finally {
      if (request === revision.current) setLoading(false);
    }
  }, [client, scope]);
  useEffect(() => {
    void load();
    return () => {
      revision.current++;
    };
  }, [load]);
  const visible = loadedFor === scope ? catalog : [];
  const choices = visible.filter(
    (item) =>
      !requests.some((request) => request.resourceId === item.id) &&
      item.name
        .toLocaleLowerCase("es")
        .includes(search.trim().toLocaleLowerCase("es")),
  );
  const paragraph = { color: colors.muted, lineHeight: 22 };
  return (
    <Card>
      <Heading
        title="Elementos solicitados"
        subtitle="Opcional. Los elementos se reservan cuando el profesor confirma el proyecto."
      />
      <Text style={paragraph}>
        Las cantidades disponibles son una referencia: otras propuestas pueden
        confirmarse antes. La reserva se comprueba al confirmar.
      </Text>
      <Button
        title={loading ? "Actualizando elementos…" : "Actualizar elementos"}
        variant="quiet"
        disabled={loading || disabled}
        onPress={() => {
          void load();
        }}
      />
      {!!(loadError || error) && (
        <Text
          accessibilityRole="alert"
          style={{ color: colors.error, lineHeight: 22 }}
        >
          {loadError || error}
        </Text>
      )}
      {loading && <ActivityIndicator color={colors.primary} />}
      {requests.map((item) => {
        const resource = visible.find(
          (resource) => resource.id === item.resourceId,
        );
        const invalid = !integerQuantity(item.quantity, 1, 10000);
        return (
          <View
            key={item.resourceId}
            style={{
              paddingTop: 12,
              gap: 8,
              borderTopWidth: 1,
              borderColor: colors.outline,
            }}
          >
            <Text
              style={{ color: colors.text, fontSize: 17, fontWeight: "600" }}
            >
              {resource?.name ?? item.name}
            </Text>
            <Field
              label={`Cantidad de ${resource?.name ?? item.name}`}
              value={item.quantity}
              onChangeText={(quantity) =>
                onChange(
                  requests.map((previous) =>
                    previous.resourceId === item.resourceId
                      ? { ...previous, quantity }
                      : previous,
                  ),
                )
              }
              keyboardType="number-pad"
              maxLength={5}
              editable={!disabled}
              error={invalid ? "Usá un entero de 1 a 10000." : undefined}
            />
            {resource ? (
              <Text style={paragraph}>
                Disponibles para reservar: {resource.available} de{" "}
                {resource.total}.
                {!invalid && Number(item.quantity) > resource.available
                  ? " El pedido supera la disponibilidad actual; no podrá confirmarse mientras falten unidades."
                  : ""}
              </Text>
            ) : loadedFor === scope && !loading && !loadError ? (
              <Text style={{ color: colors.error }}>
                Este elemento ya no está activo. Quitalo antes de enviar.
              </Text>
            ) : null}
            {remove === item.resourceId ? (
              <InlineConfirm
                text={`¿Quitar ${item.name} del pedido?`}
                confirmLabel="Quitar del pedido"
                onCancel={() => setRemove(null)}
                onConfirm={() => {
                  onChange(
                    requests.filter(
                      (previous) => previous.resourceId !== item.resourceId,
                    ),
                  );
                  setRemove(null);
                }}
              />
            ) : (
              <Button
                title={`Quitar ${item.name} del pedido`}
                variant="quiet"
                disabled={disabled}
                onPress={() => setRemove(item.resourceId)}
              />
            )}
          </View>
        );
      })}
      <Field
        label="Buscar elemento para el pedido"
        value={search}
        onChangeText={setSearch}
        editable={!disabled}
        maxLength={100}
      />
      {!loading && loadedFor === scope && !loadError && !visible.length && (
        <Text style={paragraph}>
          La organización todavía no cargó elementos. Podés presentar el
          proyecto sin pedir recursos.
        </Text>
      )}
      {choices.slice(0, 20).map((item) => (
        <Button
          key={item.id}
          title={`Agregar ${item.name} · ${item.available} disponibles`}
          variant="secondary"
          disabled={disabled || requests.length >= 50}
          onPress={() => {
            onChange([
              ...requests,
              { resourceId: item.id, name: item.name, quantity: "1" },
            ]);
            setSearch("");
          }}
        />
      ))}
      {choices.length > 20 && (
        <Text style={paragraph}>
          Se muestran 20 coincidencias. Escribí un nombre para acotar la
          búsqueda.
        </Text>
      )}
      {!!visible.length && !choices.length && (
        <Text style={paragraph}>
          No hay más elementos que coincidan con la búsqueda.
        </Text>
      )}
    </Card>
  );
}
