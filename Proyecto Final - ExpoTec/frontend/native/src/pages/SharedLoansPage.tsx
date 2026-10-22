import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  Button,
  Card,
  Chip,
  Choice,
  Field,
  Heading,
  Screen,
} from "../components/ui";
import SharedLendingForm from "../components/SharedLendingForm";
import SharedReturnForm from "../components/SharedReturnForm";
import ContentGrid from "../components/ContentGrid";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { formatDate } from "../lib/format";
import type { LoanSummary, SharedLoan } from "../lib/sharedLoans";

function moment(value: string) {
  return `${formatDate(value)} ${new Date(value).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function SharedLoansPage({
  onAccount,
}: {
  onAccount: () => void;
}) {
  const { client, user, ready } = useAuth(),
    { colors } = useTheme();
  const canManage =
    ready && !!user?.roles.some((role) => role === "admin" || role === "loans");
  const scope = `${user?.id}:${user?.roles.join(",")}`;
  const [day, setDay] = useState("1"),
    [view, setView] = useState("open"),
    [search, setSearch] = useState("");
  const [loans, setLoans] = useState<LoanSummary[]>([]),
    [loadedFor, setLoadedFor] = useState("");
  const [summary, setSummary] = useState({
    pendingCount: 0,
    pendingQuantity: 0,
  });
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [more, setMore] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [deliveryScope, setDeliveryScope] = useState("");
  const [operation, setOperation] = useState<{
    scope: string;
    loan: SharedLoan;
    noteOnly: boolean;
    revision: number;
  } | null>(null);
  const [history, setHistory] = useState<{
    scope: string;
    loan: SharedLoan;
  } | null>(null);
  const revision = useRef(0),
    working = useRef(false);
  const listScope = `${scope}:${view}:${view === "day" ? day : "all"}`;
  const lending = canManage && deliveryScope === scope,
    receiving = canManage && operation?.scope === scope ? operation : null;
  const editing = lending || !!receiving;
  const load = useCallback(
    async (offset = 0) => {
      if (!canManage) {
        setLoading(false);
        return;
      }
      const request = ++revision.current;
      setLoading(true);
      setError("");
      try {
        const result = await client.send<{
          loans: LoanSummary[];
          summary: typeof summary;
        }>("/api/loans/query", {
          limit: 25,
          offset,
          ...(view === "day" ? { day: Number(day) } : {}),
          openOnly: view === "open",
        });
        if (request !== revision.current) return;
        setLoans((current) =>
          offset
            ? [
                ...current,
                ...result.loans.filter(
                  (item) =>
                    !current.some((previous) => previous.id === item.id),
                ),
              ]
            : result.loans,
        );
        setSummary(result.summary);
        setLoadedFor(listScope);
        setMore(result.loans.length === 25);
      } catch (cause) {
        if (request === revision.current)
          setError(
            cause instanceof Error
              ? cause.message
              : "No pudimos consultar los préstamos.",
          );
      } finally {
        if (request === revision.current) setLoading(false);
      }
    },
    [client, canManage, view, day, listScope],
  );
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        revision.current++;
      };
    }, [load]),
  );
  const visible = loadedFor === listScope ? loans : [];
  const matching = visible.filter((loan) =>
    `${loan.projectName} ${loan.resourceName} ${loan.note}`
      .toLocaleLowerCase("es")
      .includes(search.trim().toLocaleLowerCase("es")),
  );
  async function perform(action: () => Promise<void>) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos abrir el préstamo.",
      );
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  async function getLoan(id: string) {
    return (
      await client.send<{ loan: SharedLoan }>(`/api/loans/${id}/query`, {})
    ).loan;
  }
  const paragraph = { color: colors.muted, lineHeight: 22 };
  if (!ready)
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  if (!canManage)
    return (
      <Screen>
        <Heading
          title="Préstamos y devoluciones"
          subtitle="Ingresá con permiso de préstamos o administración para gestionar las entregas."
        />
        <Button title="Ir a Mi cuenta" onPress={onAccount} />
      </Screen>
    );
  return (
    <Screen>
      <Heading
        title="Préstamos y devoluciones"
        subtitle="Entregas, devoluciones parciales y novedades de las tres jornadas."
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button
          title="Actualizar préstamos"
          variant="quiet"
          disabled={busy || loading || editing}
          onPress={() => {
            setHistory(null);
            void load();
          }}
        />
        <Button
          title="Nueva entrega"
          icon="plus"
          disabled={busy || editing}
          onPress={() => {
            setDeliveryScope(scope);
            setHistory(null);
            setNotice("");
          }}
        />
      </View>
      <ContentGrid maxColumns={2} minItemWidth={360}>
        <Choice
          label="Jornada para entregas"
          value={day}
          disabled={busy || editing}
          options={[1, 2, 3].map((value) => ({
            value: String(value),
            label: `Jornada ${value}`,
          }))}
          onChange={(value) => {
            setDay(value);
            setHistory(null);
            setNotice("");
          }}
        />
        <Text key="day-help" style={paragraph}>
          La jornada identifica la entrega; la fecha y hora se registran al
          guardarla. Cambiar de jornada no devuelve elementos ni libera sus
          reservas.
        </Text>
      </ContentGrid>
      {loadedFor === listScope && (
        <Text style={{ color: colors.text, fontSize: 16, lineHeight: 24 }}>
          {summary.pendingQuantity} unidades sin devolver ·{" "}
          {summary.pendingCount} préstamos abiertos en todas las jornadas
        </Text>
      )}
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ color: colors.error, lineHeight: 22 }}
        >
          {error}
        </Text>
      )}
      {!!notice && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: colors.success, lineHeight: 22 }}
        >
          {notice}
        </Text>
      )}
      {lending && (
        <SharedLendingForm
          key={`${scope}:${day}`}
          day={Number(day)}
          onClose={() => setDeliveryScope("")}
          onSaved={(loan) => {
            setDeliveryScope("");
            setNotice(
              `Entrega registrada: ${loan.quantity} unidades de ${loan.resourceName} a ${loan.projectName}, jornada ${loan.day}.`,
            );
            void load();
          }}
        />
      )}
      {receiving && (
        <SharedReturnForm
          key={`${scope}:${receiving.loan.id}:${receiving.loan.version}:${receiving.noteOnly}:${receiving.revision}`}
          loan={receiving.loan}
          noteOnly={receiving.noteOnly}
          onClose={() => setOperation(null)}
          onSaved={(loan) => {
            setOperation(null);
            setHistory({ scope: listScope, loan });
            setNotice(
              receiving.noteOnly
                ? "Novedad registrada. El saldo del préstamo se conserva."
                : `Devolución registrada. Quedan ${loan.quantity - loan.returned} unidades sin devolver en este préstamo.`,
            );
            void load();
          }}
          onReload={async () => {
            const loan = await getLoan(receiving.loan.id);
            if (loan.quantity === loan.returned && !receiving.noteOnly) {
              setOperation(null);
              setNotice("Este préstamo ya fue devuelto por completo.");
              void load();
            } else
              setOperation({
                scope,
                loan,
                noteOnly: receiving.noteOnly,
                revision: receiving.revision + 1,
              });
          }}
        />
      )}
      <ContentGrid maxColumns={2} minItemWidth={360}>
        <Choice
          label="Vista de préstamos"
          value={view}
          disabled={busy || editing}
          options={[
            { value: "open", label: "Pendientes de todas las jornadas" },
            { value: "day", label: "Entregas de la jornada elegida" },
            { value: "all", label: "Todo el historial" },
          ]}
          onChange={(value) => {
            setView(value);
            setHistory(null);
            setSearch("");
          }}
        />
        <Field
          label="Buscar en los préstamos cargados"
          value={search}
          onChangeText={setSearch}
          maxLength={120}
          hint="Podés buscar por proyecto, elemento u observación. Cargá más registros si faltan resultados."
        />
      </ContentGrid>
      {loading && !visible.length ? (
        <ActivityIndicator color={colors.primary} />
      ) : !visible.length && !error ? (
        <Card>
          <Text style={paragraph}>
            {view === "open"
              ? "No hay elementos pendientes de devolución."
              : "No hay entregas en esta vista."}
          </Text>
        </Card>
      ) : null}
      {!!visible.length && !matching.length && (
        <Text style={paragraph}>
          No hay coincidencias entre los préstamos cargados.
        </Text>
      )}
      <ContentGrid minItemWidth={360}>
        {matching.map((loan) => {
          const remaining = loan.quantity - loan.returned,
            shownHistory =
              history?.scope === listScope && history.loan.id === loan.id
                ? history.loan
                : null;
          return (
            <Card key={loan.id}>
              <Chip
                label={
                  remaining === 0
                    ? "Devuelto"
                    : loan.returned
                      ? "Devolución parcial"
                      : "En préstamo"
                }
                tone={remaining === 0 ? "success" : "warning"}
              />
              <Heading
                title={loan.projectName}
                subtitle={`${loan.resourceName} · Jornada ${loan.day}`}
              />
              <Text style={{ color: colors.text, lineHeight: 24 }}>
                Entregadas: {loan.quantity} · Devueltas: {loan.returned} · Sin
                devolver: {remaining}
              </Text>
              <Text style={paragraph}>
                Entrega: {moment(loan.createdAt)} · {loan.deliveredFirstName}{" "}
                {loan.deliveredLastName}
              </Text>
              <Text style={paragraph}>
                Retiró: {loan.recipientFirstName} {loan.recipientLastName}
              </Text>
              {!!loan.note && (
                <Text style={paragraph}>
                  Observación de entrega: {loan.note}
                </Text>
              )}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {remaining > 0 && (
                  <Button
                    title="Devolver"
                    accessibilityLabel={`Devolver ${loan.resourceName} de ${loan.projectName}`}
                    icon="check"
                    disabled={busy || editing}
                    onPress={() => {
                      void perform(async () => {
                        const fresh = await getLoan(loan.id);
                        if (fresh.quantity === fresh.returned) {
                          setNotice(
                            "Este préstamo ya fue devuelto por completo.",
                          );
                          void load();
                        } else {
                          setOperation({
                            scope,
                            loan: fresh,
                            noteOnly: false,
                            revision: 0,
                          });
                          setNotice("");
                        }
                      });
                    }}
                  />
                )}
                <Button
                  title="Registrar novedad"
                  accessibilityLabel={`Registrar novedad de ${loan.resourceName} de ${loan.projectName}`}
                  variant="secondary"
                  disabled={busy || editing}
                  onPress={() => {
                    void perform(async () => {
                      setOperation({
                        scope,
                        loan: await getLoan(loan.id),
                        noteOnly: true,
                        revision: 0,
                      });
                      setNotice("");
                    });
                  }}
                />
                <Button
                  title="Ver movimientos"
                  accessibilityLabel={`Ver movimientos de ${loan.resourceName} de ${loan.projectName}`}
                  variant="quiet"
                  disabled={busy || editing}
                  onPress={() => {
                    void perform(async () =>
                      setHistory({
                        scope: listScope,
                        loan: await getLoan(loan.id),
                      }),
                    );
                  }}
                />
              </View>
              {shownHistory && (
                <View style={{ gap: 12 }}>
                  <Heading title="Devoluciones y novedades" />
                  {!shownHistory.returns.length && (
                    <Text style={paragraph}>
                      Todavía no hay devoluciones ni novedades registradas.
                    </Text>
                  )}
                  {shownHistory.returns.map((entry) => (
                    <View key={entry.id} style={{ gap: 4 }}>
                      <Text style={{ color: colors.text, fontWeight: "600" }}>
                        {entry.quantity
                          ? `Devolución: ${entry.quantity} · Dañadas: ${entry.damagedQuantity}`
                          : "Novedad sin devolución"}
                      </Text>
                      <Text style={paragraph}>
                        {moment(entry.createdAt)} · {entry.firstName}{" "}
                        {entry.lastName}
                      </Text>
                      {!!entry.note && (
                        <Text style={paragraph}>{entry.note}</Text>
                      )}
                    </View>
                  ))}
                  <Text style={paragraph}>
                    Se muestran los últimos 100 movimientos; el historial se
                    conserva en el servidor.
                  </Text>
                  <Button
                    title="Cerrar movimientos"
                    variant="quiet"
                    onPress={() => setHistory(null)}
                  />
                </View>
              )}
            </Card>
          );
        })}
      </ContentGrid>
      {more && loadedFor === listScope && (
        <Button
          title={loading ? "Cargando préstamos…" : "Cargar más préstamos"}
          variant="secondary"
          disabled={loading || busy || editing}
          onPress={() => {
            void load(loans.length);
          }}
        />
      )}
    </Screen>
  );
}
