export type FloorplanSize = { width: number; height: number };

/** El contenedor determina el plano; su altura medida nunca se reutiliza para dimensionarlo. */
export function floorplanSize(
  containerWidth: number,
  viewport: FloorplanSize,
): FloorplanSize {
  const width = Math.max(
    5,
    Math.round(Number.isFinite(containerWidth) ? containerWidth : 320),
  );
  const compact = viewport.width < 700;
  const minimum = compact
    ? Math.max(234, Math.min(324, viewport.height - 400))
    : 360;
  return {
    width,
    height: Math.round(
      Math.max(
        minimum,
        compact ? 0 : Math.min(520, width * 0.6),
        // En una vista angosta y apaisada, este mínimo conserva los tiradores de mesas giradas.
        width * (compact ? 0.45 : 0.36),
      ),
    ),
  };
}
