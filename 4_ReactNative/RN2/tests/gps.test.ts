import test from 'node:test';
import assert from 'node:assert/strict';
import type { LocationObject, LocationSubscription } from 'expo-location';
import { createGpsSession, type GpsState } from '../src/services/gpsSession';

type Api = Parameters<typeof createGpsSession>[0];
type Permission = Awaited<ReturnType<Api['getForegroundPermissionsAsync']>>;
const granted = {
  granted: true,
  canAskAgain: true,
  status: 'granted',
  expires: 'never',
} as Permission;
const denied = { ...granted, granted: false, status: 'denied', canAskAgain: false } as Permission;
const point: LocationObject = {
  timestamp: 1000,
  coords: {
    latitude: -34.6,
    longitude: -58.4,
    accuracy: 20,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

function harness() {
  const states: GpsState[] = [];
  const initialFix = deferred<LocationObject>();
  let receive!: (value: LocationObject) => void;
  let fail!: (message: string) => void;
  let removed = 0;
  let requested = 0;
  let watchOptions: Parameters<Api['watchPositionAsync']>[0] | undefined;
  const api: Api = {
    Accuracy: { Balanced: 3 },
    getForegroundPermissionsAsync: async () => granted,
    requestForegroundPermissionsAsync: async () => {
      requested++;
      return granted;
    },
    hasServicesEnabledAsync: async () => true,
    getProviderStatusAsync: async () => ({
      locationServicesEnabled: true,
      backgroundModeEnabled: false,
      networkAvailable: true,
      gpsAvailable: true,
      passiveAvailable: true,
    }),
    enableNetworkProviderAsync: async () => undefined,
    getCurrentPositionAsync: () => initialFix.promise,
    watchPositionAsync: async (options, callback, error) => {
      watchOptions = options;
      receive = callback;
      fail = error!;
      return {
        remove: () => {
          removed++;
        },
      };
    },
  };
  const session = createGpsSession(api, true, true, (state) => states.push(state));
  return {
    api,
    session,
    states,
    initialFix,
    get latest() {
      return states.at(-1)!;
    },
    get removed() {
      return removed;
    },
    get requested() {
      return requested;
    },
    get options() {
      return watchOptions;
    },
    receive: (value: LocationObject) => receive(value),
    fail: () => fail('Native location error'),
  };
}

test('GPS: permiso ya concedido no vuelve a abrir diálogo y obtiene un punto sin movimiento', async (t) => {
  const h = harness();
  t.after(h.session.dispose);
  await h.session.start();
  assert.equal(h.requested, 0);
  assert.equal(h.options?.distanceInterval, 0);
  assert.equal(h.options?.mayShowUserSettingsDialog, false);
  assert.equal(h.options?.accuracy, 3);
  h.initialFix.resolve(point);
  await flush();
  assert.deepEqual(h.latest.point, point);
  assert.equal(h.latest.busy, false);
  assert.equal(h.latest.active, true);
});

test('GPS: background temporal del permiso Android no cancela silenciosamente el inicio', async (t) => {
  const h = harness();
  t.after(h.session.dispose);
  h.api.getForegroundPermissionsAsync = async () => ({ ...granted, granted: false });
  h.api.requestForegroundPermissionsAsync = async () => {
    h.session.onAppStateChange('background');
    return granted;
  };
  const starting = h.session.start();
  await flush();
  assert.equal(h.latest.busy, true);
  assert.equal(h.latest.error, '');
  h.session.onAppStateChange('active');
  await starting;
  h.receive(point);
  assert.equal(h.latest.active, true);
  assert.equal(h.latest.error, '');
  assert.deepEqual(h.latest.point, point);
});

test('GPS: el diálogo de precisión mejorada tampoco invalida la sesión', async (t) => {
  const h = harness();
  t.after(h.session.dispose);
  h.api.getProviderStatusAsync = async () => ({
    locationServicesEnabled: true,
    backgroundModeEnabled: false,
    networkAvailable: false,
  });
  h.api.enableNetworkProviderAsync = async () => {
    h.session.onAppStateChange('background');
  };
  const starting = h.session.start();
  await flush();
  assert.equal(h.latest.busy, true);
  h.session.onAppStateChange('active');
  await starting;
  h.receive(point);
  assert.equal(h.latest.active, true);
  assert.equal(h.latest.error, '');
});

test('GPS: salir realmente de la app libera el GPS y deja una explicación visible', async () => {
  const h = harness();
  await h.session.start();
  h.session.onAppStateChange('background');
  assert.equal(h.removed, 1);
  assert.equal(h.latest.busy, false);
  assert.equal(h.latest.active, false);
  assert.match(h.latest.error, /pausó/u);
  h.initialFix.resolve(point);
  await flush();
  assert.equal(h.latest.point, null);
  h.session.dispose();
});

test('GPS: timeout muestra error, libera recursos y descarta una respuesta tardía', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = harness();
  t.after(h.session.dispose);
  await h.session.start();
  t.mock.timers.tick(30001);
  assert.match(h.latest.error, /30 segundos/u);
  assert.equal(h.latest.busy, false);
  assert.equal(h.removed, 1);
  h.initialFix.resolve(point);
  await flush();
  assert.equal(h.latest.point, null);
});

test('GPS: cancelar mientras se registra la suscripción elimina el listener tardío', async () => {
  const h = harness();
  const pending = deferred<LocationSubscription>();
  let removed = 0;
  h.api.watchPositionAsync = () => pending.promise;
  const starting = h.session.start();
  await flush();
  h.session.stop();
  pending.resolve({
    remove: () => {
      removed++;
    },
  });
  await starting;
  h.initialFix.resolve(point);
  await flush();
  assert.equal(removed, 1);
  assert.equal(h.latest.active, false);
  assert.equal(h.latest.point, null);
  h.session.dispose();
});

test('GPS: un primer punto no deja bloqueado el inicio si la suscripción se demora', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = harness();
  t.after(h.session.dispose);
  const pending = deferred<LocationSubscription>();
  h.api.watchPositionAsync = () => pending.promise;
  const starting = h.session.start();
  await flush();
  h.initialFix.resolve(point);
  await flush();
  assert.deepEqual(h.latest.point, point);
  assert.equal(h.latest.busy, true);
  t.mock.timers.tick(30001);
  assert.equal(h.latest.busy, false);
  assert.match(h.latest.error, /seguimiento/u);
  let removed = 0;
  pending.resolve({
    remove: () => {
      removed++;
    },
  });
  await starting;
  assert.equal(removed, 1);
  assert.equal(h.latest.active, false);
});

test('GPS: desmontar no publica resultados ni estados posteriores', async () => {
  const h = harness();
  await h.session.start();
  h.session.dispose();
  const count = h.states.length;
  h.initialFix.resolve(point);
  await flush();
  assert.equal(h.removed, 1);
  assert.equal(h.states.length, count);
});

test('GPS: permiso bloqueado y GPS apagado dejan errores recuperables', async (t) => {
  const h = harness();
  t.after(h.session.dispose);
  h.api.getForegroundPermissionsAsync = async () => denied;
  h.api.requestForegroundPermissionsAsync = async () => denied;
  await h.session.start();
  assert.equal(h.latest.blocked, true);
  assert.match(h.latest.error, /permiso/u);
  h.api.getForegroundPermissionsAsync = async () => granted;
  h.api.hasServicesEnabledAsync = async () => false;
  await h.session.start();
  assert.equal(h.latest.busy, false);
  assert.match(h.latest.error, /desactivada/u);
});

test('GPS: la lectura inicial tardía no reemplaza una actualización más reciente', async (t) => {
  const h = harness();
  t.after(h.session.dispose);
  await h.session.start();
  const newer = { ...point, timestamp: 2000 };
  h.receive(newer);
  h.initialFix.resolve(point);
  await flush();
  assert.deepEqual(h.latest.point, newer);
});

test('GPS: una interrupción conserva el último punto y muestra el motivo', async (t) => {
  const h = harness();
  t.after(h.session.dispose);
  await h.session.start();
  h.receive(point);
  h.fail();
  assert.equal(h.latest.active, false);
  assert.equal(h.removed, 1);
  assert.deepEqual(h.latest.point, point);
  assert.match(h.latest.error, /interrumpió/u);
});
