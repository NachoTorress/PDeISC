import type { LocationObject, LocationOptions, LocationSubscription } from 'expo-location';
import { isPayload } from '../utils/validation';

type LocationApi = Pick<
  typeof import('expo-location'),
  | 'getForegroundPermissionsAsync'
  | 'requestForegroundPermissionsAsync'
  | 'hasServicesEnabledAsync'
  | 'getProviderStatusAsync'
  | 'enableNetworkProviderAsync'
  | 'getCurrentPositionAsync'
  | 'watchPositionAsync'
> & { Accuracy: { Balanced: LocationOptions['accuracy'] } };

export type GpsState = {
  point: LocationObject | null;
  active: boolean;
  busy: boolean;
  error: string;
  blocked: boolean;
};
export const INITIAL_GPS_STATE: GpsState = {
  point: null,
  active: false,
  busy: false,
  error: '',
  blocked: false,
};
class GpsMessage extends Error {}

function locationError(cause: unknown): string {
  if (cause instanceof GpsMessage) return cause.message;
  const code =
    typeof cause === 'object' && cause !== null && 'code' in cause ? String(cause.code) : '';
  if (/UNAUTHORIZED|PERMISSION/iu.test(code))
    return 'El permiso de ubicación está desactivado. Habilitalo en los ajustes de Pulso.';
  if (/SETTINGS|PROVIDER/iu.test(code))
    return 'Activá la ubicación y la precisión de ubicación de Google en los ajustes del teléfono y volvé a intentar.';
  return 'No se pudo obtener la ubicación. Revisá el GPS y la precisión de ubicación del teléfono y volvé a intentar.';
}

/** Sesión del GPS independiente de React: protege diálogos nativos y descarta respuestas tardías. */
export function createGpsSession(
  api: LocationApi,
  android: boolean,
  initiallyForeground: boolean,
  onChange: (state: GpsState) => void,
) {
  let state = { ...INITIAL_GPS_STATE };
  let foreground = initiallyForeground;
  let disposed = false;
  let starting = false;
  let dialogOwner: number | null = null;
  let generation = 0;
  let watcher: LocationSubscription | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let resume: { resolve: () => void; reject: () => void } | null = null;

  function publish(patch: Partial<GpsState>) {
    state = { ...state, ...patch };
    if (!disposed) onChange(state);
  }
  function clearTimer() {
    if (timer) clearTimeout(timer);
    timer = null;
  }
  function stop() {
    generation += 1;
    watcher?.remove();
    watcher = null;
    clearTimer();
    starting = false;
    resume?.reject();
    publish({ active: false, busy: false });
  }
  function waitForResume() {
    if (foreground) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      const deadline = setTimeout(() => {
        resume = null;
        reject(new GpsMessage('Volvé a Pulso y tocá Iniciar GPS para continuar la búsqueda.'));
      }, 3000);
      resume = {
        resolve: () => {
          clearTimeout(deadline);
          resume = null;
          resolve();
        },
        reject: () => {
          clearTimeout(deadline);
          resume = null;
          reject(new GpsMessage('Búsqueda cancelada.'));
        },
      };
    });
  }
  async function nativeDialog<T>(run: number, request: () => Promise<T>): Promise<T> {
    dialogOwner = run;
    try {
      const response = await request();
      // Android puede emitir "background" al mostrar permisos o precisión mejorada.
      if (run === generation && !disposed) await waitForResume();
      return response;
    } finally {
      if (dialogOwner === run) dialogOwner = null;
    }
  }
  function onAppStateChange(next: string) {
    foreground = next === 'active';
    if (foreground) resume?.resolve();
    if (next === 'background' && dialogOwner !== generation && (starting || watcher)) {
      stop();
      publish({ error: 'El GPS se pausó al salir de Pulso. Volvé a iniciarlo para continuar.' });
    }
  }

  async function start() {
    if (disposed || starting || watcher) return;
    if (!foreground) {
      publish({ error: 'Volvé a Pulso para iniciar el GPS.' });
      return;
    }
    const run = ++generation;
    const current = () => run === generation && !disposed;
    starting = true;
    publish({ busy: true, error: '', blocked: false, point: null });
    try {
      let permission = await api.getForegroundPermissionsAsync();
      if (!current()) return;
      if (!permission.granted)
        permission = await nativeDialog(run, () => api.requestForegroundPermissionsAsync());
      if (!current()) return;
      if (!permission.granted) {
        publish({ blocked: !permission.canAskAgain });
        throw new GpsMessage(
          'Se necesita el permiso de ubicación. Habilitalo para consultar el GPS.',
        );
      }
      if (!(await api.hasServicesEnabledAsync()))
        throw new GpsMessage(
          'La ubicación del teléfono está desactivada. Encendé el GPS y volvé a intentar.',
        );
      if (!current()) return;
      if (android) {
        const providers = await api.getProviderStatusAsync();
        if (!current()) return;
        if (providers.networkAvailable === false)
          await nativeDialog(run, () => api.enableNetworkProviderAsync());
      }
      if (!current()) return;

      const receive = (next: LocationObject) => {
        if (
          !current() ||
          !Number.isFinite(next.timestamp) ||
          !isPayload({ kind: 'location', ...next.coords })
        )
          return;
        if (watcher) clearTimer();
        if (state.point && next.timestamp < state.point.timestamp) return;
        publish({ point: next, busy: watcher === null });
      };
      const options: LocationOptions = {
        accuracy: api.Accuracy.Balanced,
        mayShowUserSettingsDialog: false,
      };
      timer = setTimeout(() => {
        if (!current()) return;
        stop();
        publish({
          error: state.point
            ? 'No se pudo iniciar el seguimiento. La última posición se conserva; volvé a iniciar el GPS.'
            : 'No se recibió una posición en 30 segundos. Revisá la precisión de ubicación, acercate a una ventana y volvé a intentar.',
        });
      }, 30000);
      // La consulta inicial obtiene un punto sin exigir movimiento; la suscripción lo mantiene actualizado.
      void api
        .getCurrentPositionAsync(options)
        .then(receive)
        .catch(() => undefined);
      const subscription = await api.watchPositionAsync(
        { ...options, timeInterval: 1500, distanceInterval: 0 },
        receive,
        () => {
          if (!current()) return;
          stop();
          publish({
            error:
              'Se interrumpió la señal de ubicación. La última posición recibida se conserva; podés volver a iniciar el GPS.',
          });
        },
      );
      if (!current()) {
        subscription.remove();
        return;
      }
      watcher = subscription;
      if (state.point) clearTimer();
      publish({ active: true, busy: state.point === null });
    } catch (cause) {
      if (!current()) return;
      stop();
      publish({ error: locationError(cause) });
    } finally {
      if (current()) starting = false;
    }
  }

  return {
    start,
    stop,
    onAppStateChange,
    dispose() {
      disposed = true;
      stop();
    },
  };
}
