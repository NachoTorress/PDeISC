import { useState } from "react";
import { Text, View } from "react-native";
import {
  Button,
  Card,
  Field,
  PageHeading,
  ActionRow,
  InlineConfirm,
  Screen,
  Section,
} from "../components/ui";
import { useTheme } from "../contexts/ThemeContext";
import { useDemo } from "../hooks/useDemo";
import { formatDate } from "../lib/format";
import { resourceUsed } from "../lib/model";
import type { Resource } from "../lib/types";
import ResourceForm from "./ResourceForm";
import ContentGrid from "../components/ContentGrid";

export default function InventoryPage() {
  const { state, role, mutate, notify } = useDemo();
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const canManage = role === "admin";
  const query = search.trim().toLocaleLowerCase("es");
  const resources = state.resources.filter((resource) =>
    resource.name.toLocaleLowerCase("es").includes(query),
  );
  const open = state.loans.reduce(
    (sum, loan) => sum + loan.quantity - loan.returned,
    0,
  );

  function remove(resource: Resource) {
    const result = mutate({ type: "deleteResource", id: resource.id });
    if (result) {
      setDeleteError(result);
      return;
    }
    setDeleteId(null);
    notify(`${resource.name} se eliminó del inventario.`);
  }

  return (
    <Screen>
      <PageHeading
        icon="inventory"
        tone="info"
        title="Inventario"
        subtitle="Organizá los elementos antes de la muestra y seguí su disponibilidad."
      />
      {canManage && !adding && (
        <Button
          title="Agregar elemento"
          icon="plus"
          onPress={() => {
            setAdding(true);
            setEditingId(null);
            setDeleteId(null);
          }}
        />
      )}
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>
          {state.resources.length} tipos de elementos · {open} unidades sin
          devolver
        </Text>
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
          El stock se reserva cuando un profesor confirma el proyecto.
        </Text>
      </View>
      {!canManage && (
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
          La administración puede agregar elementos y actualizar el stock.
        </Text>
      )}
      {canManage && adding && <ResourceForm onClose={() => setAdding(false)} />}
      <Section title="Elementos de ExpoTec">
        <Field
          label="Buscar elemento"
          value={search}
          onChangeText={setSearch}
        />
        {resources.length === 0 ? (
          <Card>
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              {query
                ? "No encontramos ese elemento"
                : "El inventario está vacío"}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
              {query
                ? "Probá con otro nombre."
                : "Agregá los elementos que se van a prestar durante ExpoTec."}
            </Text>
            {!!query && (
              <Button
                title="Limpiar búsqueda"
                icon="close"
                variant="secondary"
                onPress={() => setSearch("")}
              />
            )}
          </Card>
        ) : (
          <ContentGrid
            testID="inventory-grid"
            minItemWidth={280}
            maxColumns={4}
          >
            {resources.map((resource) => {
              const assigned = resourceUsed(state, resource.id);
              const out = state.loans
                .filter((loan) => loan.resourceId === resource.id)
                .reduce((sum, loan) => sum + loan.quantity - loan.returned, 0);
              const hasHistory = state.loans.some(
                (loan) => loan.resourceId === resource.id,
              );
              const requested = state.projects.some((project) =>
                Object.hasOwn(project.resources, resource.id),
              );
              const canDelete = !hasHistory && !requested;
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
                      fontWeight: "600",
                    }}
                  >
                    {resource.name}
                  </Text>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                  >
                    {[
                      {
                        label: "Total",
                        value: resource.total,
                        ink: colors.text,
                      },
                      { label: "Asignadas", value: assigned, ink: colors.text },
                      {
                        label: "Disponibles",
                        value: Math.max(0, resource.total - assigned),
                        ink: colors.success,
                      },
                      {
                        label: "Sin devolver",
                        value: out,
                        ink: out ? colors.onWarning : colors.text,
                      },
                    ].map((stat) => (
                      <View
                        key={stat.label}
                        style={{ flex: 1, minWidth: 54, gap: 2 }}
                      >
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
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: 13,
                      lineHeight: 19,
                    }}
                  >
                    Creado: {formatDate(resource.createdAt)}
                    {canManage && !canDelete
                      ? ` · ${hasHistory ? "Con historial de préstamos" : "Solicitado por un proyecto"}`
                      : ""}
                  </Text>
                  {canManage && (
                    <>
                      <ActionRow compact footer>
                        {editingId !== resource.id && (
                          <Button
                            title="Editar"
                            accessibilityLabel={`Editar ${resource.name}`}
                            style={{ minWidth: 100 }}
                            icon="edit"
                            variant="secondary"
                            onPress={() => {
                              setEditingId(resource.id);
                              setAdding(false);
                              setDeleteId(null);
                            }}
                          />
                        )}
                        {canDelete && deleteId !== resource.id && (
                          <Button
                            title="Eliminar"
                            accessibilityLabel={`Eliminar ${resource.name}`}
                            style={{ minWidth: 100 }}
                            icon="trash"
                            variant="danger"
                            onPress={() => {
                              setDeleteId(resource.id);
                              setEditingId(null);
                              setAdding(false);
                              setDeleteError("");
                            }}
                          />
                        )}
                      </ActionRow>
                      {editingId === resource.id && (
                        <ResourceForm
                          key={resource.id}
                          resource={resource}
                          onClose={() => setEditingId(null)}
                        />
                      )}
                      {deleteId === resource.id && (
                        <>
                          {!!deleteError && (
                            <Text
                              accessibilityRole="alert"
                              style={{
                                color: colors.error,
                                fontSize: 14,
                                lineHeight: 21,
                              }}
                            >
                              {deleteError}
                            </Text>
                          )}
                          <InlineConfirm
                            text={`¿Estás seguro de eliminar ${resource.name}? Se quitará del inventario.`}
                            confirmLabel="Sí, eliminar"
                            onConfirm={() => remove(resource)}
                            onCancel={() => setDeleteId(null)}
                          />
                        </>
                      )}
                    </>
                  )}
                </Card>
              );
            })}
          </ContentGrid>
        )}
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
          Disponible para asignar = total menos lo reservado por proyectos
          confirmados. “Sin devolver” suma todas las jornadas.
        </Text>
      </Section>
    </Screen>
  );
}
