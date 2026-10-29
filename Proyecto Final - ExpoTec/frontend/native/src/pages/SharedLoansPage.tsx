/**
 * Pantalla del sistema compartido (datos de la API). Préstamos (préstamos y
 * administración): entregas y devoluciones de las tres jornadas.
 * Cada préstamo se muestra con `LoanCard` y sus movimientos con `LoanHistory`
 * (carpeta `components/loans/`).
 */
import { useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Button, Card, Choice, Field, PageHeading, Screen, RefreshButton } from "../components/ui";
import SharedLendingForm from "../components/SharedLendingForm";
import SharedReturnForm from "../components/SharedReturnForm";
import ContentGrid from "../components/ContentGrid";
import { LoanCard } from "../components/loans/LoanCard";
import { LoanHistory } from "../components/loans/LoanHistory";
import { useAuth } from "../contexts/AuthContext";
import { useLoanList } from "../hooks/useLoanList";
import { useTheme } from "../contexts/ThemeContext";
import type { LoanSummary, SharedLoan } from "../lib/sharedLoans";

/** Lista de movimientos por jornada, pendientes o historial. */
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
  const [busy, setBusy] = useState(false);
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
  const working = useRef(false);
  const listScope = `${scope}:${view}:${view === "day" ? day : "all"}`;
  const lending = canManage && deliveryScope === scope,
    receiving = canManage && operation?.scope === scope ? operation : null;
  const editing = lending || !!receiving;
  const { loans, summary, loading, more, loadedFor, load } = useLoanList({
    client,
    enabled: canManage,
    view,
    day,
    listScope,
    onError: setError,
  });
  const visible = loadedFor === listScope ? loans : [];
  const matching = visible.filter((loan) =>
    `${loan.projectName} ${loan.resourceName} ${loan.note}`
      .toLocaleLowerCase("es")
      .includes(search.trim().toLocaleLowerCase("es")),
  );
  /** Ejecuta una acción con estado de carga y aviso de resultado. */
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
  /** Consulta el detalle actualizado de un préstamo. */
  async function getLoan(id: string) {
    return (
      await client.send<{ loan: SharedLoan }>(`/api/loans/${id}/query`, {})
    ).loan;
  }
  /** Abre la devolución con datos actualizados (o avisa si ya se devolvió todo). */
  function startReturn(loan: LoanSummary) {
    void perform(async () => {
      const fresh = await getLoan(loan.id);
      if (fresh.quantity === fresh.returned) {
        setNotice("Este préstamo ya fue devuelto por completo.");
        void load();
      } else {
        setOperation({ scope, loan: fresh, noteOnly: false, revision: 0 });
        setNotice("");
      }
    });
  }
  /** Abre el registro de una novedad sin devolución. */
  function startNote(loan: LoanSummary) {
    void perform(async () => {
      setOperation({
        scope,
        loan: await getLoan(loan.id),
        noteOnly: true,
        revision: 0,
      });
      setNotice("");
    });
  }
  /** Muestra las devoluciones y novedades del préstamo. */
  function showHistory(loan: LoanSummary) {
    void perform(async () =>
      setHistory({ scope: listScope, loan: await getLoan(loan.id) }),
    );
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
        <PageHeading
          icon="loans"
          tone="accent"
          title="Préstamos y devoluciones"
          subtitle="Ingresá con permiso de préstamos o administración para gestionar las entregas."
        />
        {!user && <Button title="Ingresar" onPress={onAccount} />}
      </Screen>
    );
  return (
    <Screen>
      <PageHeading
        icon="loans"
        tone="accent"
        title="Préstamos y devoluciones"
        subtitle="Entregas, devoluciones parciales y novedades de las tres jornadas."
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <RefreshButton
          label="Actualizar préstamos"
          loading={loading}
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
      <View style={{ gap: 12 }}>
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
        <Text style={{ ...paragraph, maxWidth: 760 }}>
          La jornada identifica la entrega; la fecha y hora se registran al
          guardarla. Cambiar de jornada no devuelve elementos ni libera sus
          reservas.
        </Text>
      </View>
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
      <View style={{ gap: 20, maxWidth: 760 }}>
        <Choice
          label="Vista de préstamos"
          value={view}
          disabled={busy || editing}
          options={[
            { value: "open", label: "Pendientes de devolución" },
            { value: "day", label: "Entregas de esta jornada" },
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
      </View>
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
        {matching.map((loan) => (
          <LoanCard
            key={loan.id}
            loan={loan}
            locked={busy || editing}
            onReturn={() => startReturn(loan)}
            onNote={() => startNote(loan)}
            onHistory={() => showHistory(loan)}
          >
            {history?.scope === listScope && history.loan.id === loan.id && (
              <LoanHistory
                loan={history.loan}
                onClose={() => setHistory(null)}
              />
            )}
          </LoanCard>
        ))}
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
