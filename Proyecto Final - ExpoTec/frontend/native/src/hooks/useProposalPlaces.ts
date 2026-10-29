/**
 * Espacios y puestos que se pueden elegir en una propuesta.
 *
 * De dónde viene: lo usa `useSharedProposal` con el cliente de la API y la
 * función que muestra errores. A dónde va: devuelve la lista de espacios, el
 * espacio elegido con sus puestos y la acción para actualizar la
 * disponibilidad sin perder el borrador.
 *
 * Consulta `POST /api/spaces/query` (lista) y `POST /api/spaces/:id/query`
 * (puestos del espacio elegido, cada vez que cambia o se actualiza).
 */
import { useEffect, useState } from "react";
import type { useAuth } from "../contexts/AuthContext";
import type { SharedSpace, SpaceSummary } from "../lib/sharedSpaces";

type Client = ReturnType<typeof useAuth>["client"];

/**
 * @param client Cliente de la API de la sesión actual.
 * @param onError Muestra un mensaje de error ("" lo borra).
 */
export function useProposalPlaces(
  client: Client,
  onError: (message: string) => void,
) {
  const [spaces, setSpaces] = useState<SpaceSummary[]>([]);
  const [spaceId, setSpaceId] = useState("");
  const [space, setSpace] = useState<SharedSpace | null>(null);
  const [spaceLoading, setSpaceLoading] = useState(false);
  const [spaceRevision, setSpaceRevision] = useState(0);

  // Consulta los puestos del espacio elegido; descarta respuestas viejas.
  useEffect(() => {
    let active = true;
    setSpace(null);
    setSpaceLoading(!!spaceId);
    if (!spaceId) return;
    client
      .query<{ space: SharedSpace }>(`/api/spaces/${spaceId}/query`, {})
      .then((result) => {
        if (active) setSpace(result.space);
      })
      .catch((cause) => {
        if (active)
          onError(
            cause instanceof Error
              ? cause.message
              : "No pudimos consultar los puestos.",
          );
      })
      .finally(() => {
        if (active) setSpaceLoading(false);
      });
    return () => {
      active = false;
    };
  }, [client, spaceId, spaceRevision, onError]);

  /** Actualiza la lista de espacios y puestos sin perder el borrador. */
  async function refreshPlaces() {
    setSpaceLoading(true);
    try {
      const result = await client.query<{ spaces: SpaceSummary[] }>(
        "/api/spaces/query",
        {},
      );
      setSpaces(result.spaces);
      setSpaceId((current) =>
        result.spaces.some((item) => item.id === current)
          ? current
          : (result.spaces[0]?.id ?? ""),
      );
      setSpaceRevision((value) => value + 1);
      onError("");
    } catch (cause) {
      onError(
        cause instanceof Error
          ? cause.message
          : "No pudimos actualizar los puestos.",
      );
    } finally {
      setSpaceLoading(false);
    }
  }

  return {
    spaces,
    setSpaces,
    spaceId,
    setSpaceId,
    space,
    spaceLoading,
    refreshPlaces,
  };
}
