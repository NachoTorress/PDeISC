/**
 * Lista paginada de préstamos con su resumen (unidades y préstamos abiertos).
 *
 * De dónde viene: lo usa `SharedLoansPage` con el filtro elegido (pendientes,
 * una jornada o todo el historial). A dónde va: devuelve los préstamos
 * cargados, el resumen, si hay más páginas y la función `load(offset)`.
 *
 * Consulta `POST /api/loans/query` de a 25 registros y vuelve a consultar
 * cada vez que la pantalla recibe el foco. Descarta respuestas viejas si el
 * filtro cambió mientras se esperaba.
 */
import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import type { useAuth } from "../contexts/AuthContext";
import type { LoanSummary } from "../lib/sharedLoans";

type Client = ReturnType<typeof useAuth>["client"];
/** Totales de préstamos abiertos en todas las jornadas. */
type Summary = { pendingCount: number; pendingQuantity: number };

export function useLoanList({
  client,
  enabled,
  view,
  day,
  listScope,
  onError,
}: {
  client: Client;
  /** false si la cuenta no tiene permiso: no consulta. */
  enabled: boolean;
  /** "open" (pendientes), "day" (una jornada) o "all". */
  view: string;
  /** Jornada elegida ("1", "2" o "3"). */
  day: string;
  /** Clave de la combinación cuenta + filtro que se está mostrando. */
  listScope: string;
  onError: (message: string) => void;
}) {
  const [loans, setLoans] = useState<LoanSummary[]>([]);
  const [loadedFor, setLoadedFor] = useState("");
  const [summary, setSummary] = useState<Summary>({
    pendingCount: 0,
    pendingQuantity: 0,
  });
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const revision = useRef(0);
  /** Carga una página de préstamos (`POST /api/loans/query`) con sus filtros. */
  const load = useCallback(
    async (offset = 0) => {
      if (!enabled) {
        setLoading(false);
        return;
      }
      const request = ++revision.current;
      setLoading(true);
      onError("");
      try {
        const result = await client.send<{
          loans: LoanSummary[];
          summary: Summary;
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
          onError(
            cause instanceof Error
              ? cause.message
              : "No pudimos consultar los préstamos.",
          );
      } finally {
        if (request === revision.current) setLoading(false);
      }
    },
    [client, enabled, view, day, listScope, onError],
  );
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        revision.current++;
      };
    }, [load]),
  );
  return { loans, summary, loading, more, loadedFor, load };
}
