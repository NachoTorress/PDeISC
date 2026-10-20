import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Evita cámaras y suscripciones activas cuando la aplicación pasa a segundo plano. */
export function useForeground(onBackground?: () => void) {
  const [active, setActive] = useState(
    AppState.currentState !== 'background' && AppState.currentState !== 'inactive',
  );
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setActive(state === 'active');
      // En iOS los permisos nativos causan "inactive"; no cancelar esa solicitud en curso.
      if (state === 'background') onBackground?.();
    });
    return () => subscription.remove();
  }, [onBackground]);
  return active;
}
