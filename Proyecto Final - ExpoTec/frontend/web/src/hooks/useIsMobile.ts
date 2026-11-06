/** Observa si la ventana mide como máximo 767 píxeles de ancho. */
import { useSyncExternalStore } from 'react';

const query = '(max-width: 767px)';
/** Suscribe los cambios de la consulta de medios y devuelve la función de limpieza. */
function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}
/** Observa si la ventana mide como máximo 767 píxeles de ancho. */
export function useIsMobile() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
