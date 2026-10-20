import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isDeviceRecord,
  isPayload,
  isOwnedPhotoUri,
  validateNotes,
  validateTitle,
} from '../src/utils/validation';
import { formatDate } from '../src/utils/format';
import { parseStoredRecords } from '../src/utils/records';

const record = {
  id: 'aabbccdd-1234',
  title: 'Prueba de sensor',
  notes: '',
  createdAt: '2026-10-15T12:30:00Z',
  updatedAt: '2026-10-15T12:30:00Z',
  payload: { kind: 'accelerometer', vector: { x: -0.5, y: 0, z: 1 }, unit: 'g' },
};

test('título: rechaza vacíos, longitud inválida y caracteres de control', () => {
  for (const value of ['', '  ', 'ab', 'a'.repeat(61), 'Una\nprueba', 'Una\u0000prueba'])
    assert.notEqual(validateTitle(value), '');
  assert.equal(validateTitle('Prueba 123 — cámara'), '');
  assert.equal(validateTitle('a'.repeat(60)), '');
});

test('notas: admite texto libre, limita a 400 caracteres', () => {
  assert.equal(validateNotes(''), '');
  assert.equal(validateNotes('a'.repeat(400)), '');
  assert.notEqual(validateNotes('a'.repeat(401)), '');
});

test('GPS: acepta hemisferios negativos y rechaza posiciones fuera del planeta', () => {
  const location = {
    kind: 'location',
    latitude: -34.6037,
    longitude: -58.3816,
    accuracy: 12,
    altitude: -2,
  };
  assert.equal(isPayload(location), true);
  for (const patch of [
    { latitude: 91 },
    { longitude: -181 },
    { accuracy: -1 },
    { latitude: NaN },
    { longitude: Infinity },
  ])
    assert.equal(isPayload({ ...location, ...patch }), false);
  assert.equal(
    isPayload({ ...location, latitude: 90, longitude: -180, accuracy: null, altitude: null }),
    true,
  );
});

test('sensores: los ejes admiten negativos, pero no NaN, infinito o unidades incorrectas', () => {
  assert.equal(isPayload(record.payload), true);
  assert.equal(isPayload({ ...record.payload, unit: 'rad/s' }), false);
  assert.equal(
    isPayload({ kind: 'gyroscope', vector: { x: 1, y: -2, z: 0 }, unit: 'rad/s' }),
    true,
  );
  assert.equal(isPayload({ ...record.payload, vector: { x: NaN, y: 1, z: 2 } }), false);
  assert.equal(isPayload({ ...record.payload, vector: { x: 1, y: Infinity, z: 2 } }), false);
});

test('lector: rechaza contenido vacío o desmedido; no interpreta el contenido', () => {
  assert.equal(isPayload({ kind: 'scanner', content: '', format: 'qr' }), false);
  assert.equal(isPayload({ kind: 'scanner', content: 'a'.repeat(4097), format: 'qr' }), false);
  assert.equal(
    isPayload({ kind: 'scanner', content: '<script>alert(1)</script>', format: 'qr' }),
    true,
  );
});

test('fotos: solo permite rutas locales y dimensiones positivas', () => {
  assert.equal(
    isPayload({ kind: 'camera', uri: 'file:///photos/test.jpg', width: 200, height: 300 }),
    true,
  );
  assert.equal(
    isPayload({ kind: 'camera', uri: 'https://example.com/image.jpg', width: 200, height: 300 }),
    false,
  );
  assert.equal(
    isPayload({ kind: 'camera', uri: 'file:///photos/test.jpg', width: 0, height: 300 }),
    false,
  );
});

test('borrado de fotos: solo permite UUID.jpg dentro del directorio propio', () => {
  const directory = 'file:///data/pulso-photos/';
  const name = 'aabbccdd-1234-5678-abcd-112233445566.jpg';
  assert.equal(isOwnedPhotoUri(directory + name, directory), true);
  assert.equal(isOwnedPhotoUri('file:///otro/' + name, directory), false);
  for (const invalid of ['../private.json', 'sub/' + name, '%2e%2e/private.json', 'foto.jpg'])
    assert.equal(isOwnedPhotoUri(directory + invalid, directory), false);
});

test('biometría: fecha y resultado explícitos; no acepta un dato sin verificar', () => {
  assert.equal(
    isPayload({
      kind: 'biometrics',
      method: 'Biometría del sistema',
      verifiedAt: '2026-10-15T12:30:00Z',
    }),
    true,
  );
  assert.equal(
    isPayload({
      kind: 'biometrics',
      method: 'Biometría del sistema',
      verifiedAt: 'fecha inválida',
    }),
    false,
  );
});

test('recuperación: rechaza registros locales incompletos o corruptos', () => {
  assert.equal(isDeviceRecord(record), true);
  assert.equal(isDeviceRecord({ ...record, title: '  ' }), false);
  assert.equal(isDeviceRecord({ ...record, createdAt: 'ayer' }), false);
  assert.equal(isDeviceRecord({ ...record, id: '../photos/test.jpg' }), false);
  assert.equal(isDeviceRecord(null), false);
  assert.equal(isDeviceRecord({ ...record, payload: { kind: 'inventado' } }), false);
});

test('fechas: presentación DD/MM/AA local y relleno de ceros', () => {
  assert.equal(formatDate(new Date(2026, 0, 3, 12).toISOString()), '03/01/26');
  assert.equal(formatDate(new Date(2026, 11, 31, 12).toISOString()), '31/12/26');
});

test('archivo local: rechaza JSON roto, estructura equivocada e identificadores duplicados', () => {
  for (const raw of [
    '{',
    '{}',
    'null',
    JSON.stringify([record, record]),
    JSON.stringify([record, { ...record, title: '' }]),
  ])
    assert.throws(() => parseStoredRecords(raw));
  assert.deepEqual(parseStoredRecords('[]'), []);
});

test('archivo local: recupera sin modificar el origen y ordena por fecha de creación', () => {
  const later = {
    ...record,
    id: '11223344-5678',
    createdAt: '2026-10-16T12:30:00Z',
    title: 'Prueba posterior',
  };
  const raw = JSON.stringify([record, later]);
  const saved = parseStoredRecords(raw);
  assert.equal(saved[0]?.id, later.id);
  assert.equal(saved[1]?.title, record.title);
  assert.equal(JSON.parse(raw)[0].id, record.id);
});
