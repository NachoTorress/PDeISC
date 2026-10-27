/** Pantalla de la demostración (datos locales del dispositivo, sin servidor). Préstamos por jornada. */
import { useState } from "react";
import { Text, View } from "react-native";
import {
  Button,
  Card,
  Chip,
  Choice,
  Field,
  PageHeading,
  Screen,
  Section,
} from "../components/ui";
import { useTheme } from "../contexts/ThemeContext";
import { useDemo } from "../hooks/useDemo";
import { formatDate } from "../lib/format";
import { resourceOut } from "../lib/model";
import { LendingForm, ReturnForm } from "./LoanForms";
import ContentGrid from "../components/ContentGrid";

/** Lista de préstamos con entrega y devolución. */
export default function LoansPage() {
  const { state, role } = useDemo();
  const { colors } = useTheme();
  const [day, setDay] = useState(1);
  const [search, setSearch] = useState("");
  const [lending, setLending] = useState(false);
  const [returnId, setReturnId] = useState<string | null>(null);
  const canManage = role === "loans" || role === "admin";
  const query = search.trim().toLocaleLowerCase("es");
  const dayLoans = state.loans.filter((loan) => loan.day === day);
  const loans = dayLoans.filter((loan) =>
    `${state.projects.find((project) => project.id === loan.projectId)?.name ?? ""} ${state.resources.find((resource) => resource.id === loan.resourceId)?.name ?? ""} ${loan.notes}`
      .toLocaleLowerCase("es")
      .includes(query),
  );
  const pending = state.resources.reduce(
    (sum, resource) => sum + resourceOut(state, resource.id, day),
    0,
  );
  const pendingLoans = dayLoans.filter(
    (loan) => loan.quantity > loan.returned,
  ).length;
  const previousPending = state.loans
    .filter((loan) => loan.day < day)
    .reduce((sum, loan) => sum + loan.quantity - loan.returned, 0);

  return (
    <Screen>
      <PageHeading icon="loans" tone="accent"
        title="Préstamos"
        subtitle="Cada entrega, cada devolución. Todo en su lugar al terminar el día."
      />
      {canManage && !lending && (
        <Button
          title="Registrar entrega"
          icon="plus"
          onPress={() => setLending(true)}
        />
      )}
      <Choice
        label="Jornada de ExpoTec"
        value={String(day)}
        options={[1, 2, 3].map((item) => ({
          value: String(item),
          label: `Día ${item}`,
        }))}
        onChange={(value) => {
          setDay(Number(value));
          setReturnId(null);
        }}
      />
      <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>
        {pending} elementos por devolver · {pendingLoans} préstamos abiertos
      </Text>
      {previousPending > 0 && (
        <Card>
          <Text style={{ color: colors.onWarning }}>
            Hay {previousPending} elementos sin devolver de jornadas anteriores.
            Revisá esas entregas antes de prestar de nuevo.
          </Text>
        </Card>
      )}
      {!canManage && (
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
          La entrega y devolución están a cargo de quienes gestionan los
          préstamos.
        </Text>
      )}
      {canManage && lending && (
        <LendingForm key={day} day={day} onClose={() => setLending(false)} />
      )}
      <Section title={`Movimientos del día ${day}`}>
        <Field
          label="Buscar proyecto o elemento"
          value={search}
          onChangeText={setSearch}
        />
        {loans.length === 0 ? (
          <Card>
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              {query
                ? "No encontramos esos movimientos"
                : "Esta jornada todavía no tiene entregas"}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
              {query
                ? "Probá con el nombre del proyecto o del elemento."
                : "Las entregas que registres aparecerán acá."}
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
          <ContentGrid>
            {loans.map((loan) => {
              const project = state.projects.find(
                (item) => item.id === loan.projectId,
              );
              const resource = state.resources.find(
                (item) => item.id === loan.resourceId,
              );
              const space = state.spaces.find(
                (item) => item.id === project?.spaceId,
              );
              const remaining = loan.quantity - loan.returned;
              const completed = remaining === 0;
              return (
                <Card key={loan.id} style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 18,
                      fontWeight: "600",
                    }}
                  >
                    {project?.name ?? "Proyecto no disponible"}
                  </Text>
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    {space?.name}
                    {project?.furnitureId ? ` · ${project.furnitureId}` : ""}
                  </Text>
                  <Text
                    style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}
                  >
                    {resource?.name ?? "Elemento no disponible"}
                  </Text>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}
                  >
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 15,
                        lineHeight: 22,
                      }}
                    >
                      Entregados: {loan.quantity}
                    </Text>
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 15,
                        lineHeight: 22,
                      }}
                    >
                      Por devolver: {remaining}
                    </Text>
                  </View>
                  <Chip
                    tone={completed ? "success" : "warning"}
                    label={
                      completed
                        ? "Devuelto"
                        : loan.returned > 0
                          ? "Devolución parcial"
                          : "En préstamo"
                    }
                  />
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    Creado: {formatDate(loan.createdAt)}
                  </Text>
                  {!!loan.notes && (
                    <Text
                      style={{
                        color: colors.muted,
                        fontSize: 14,
                        lineHeight: 20,
                      }}
                    >
                      Observación: {loan.notes}
                    </Text>
                  )}
                  {canManage && !completed && returnId !== loan.id && (
                    <Button
                      title="Devolver"
                      style={{ alignSelf: "stretch", marginTop: "auto" }}
                      icon="arrowLeft"
                      variant="secondary"
                      onPress={() => setReturnId(loan.id)}
                    />
                  )}
                  {canManage && !completed && returnId === loan.id && (
                    <ReturnForm loan={loan} onClose={() => setReturnId(null)} />
                  )}
                </Card>
              );
            })}
          </ContentGrid>
        )}
      </Section>
    </Screen>
  );
}
