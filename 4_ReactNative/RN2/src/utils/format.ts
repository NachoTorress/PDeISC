/** ISO persistido → fecha de presentación DD/MM/AA, en la zona local del usuario. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && /quota|storage.*full|disk.*full/iu.test(error.message))
    return 'El almacenamiento está lleno. Liberá espacio y volvé a intentar.';
  return fallback;
}
