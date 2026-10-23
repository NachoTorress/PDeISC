import { Accelerometer, Gyroscope } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForeground } from './useForeground';
import type { Vector3 } from '../types';

/** Suscripción 10 Hz → lecturas finitas; se libera al pausar, navegar o minimizar. */
export function useMotionSensor(kind: 'accelerometer' | 'gyroscope') {
  const sensor = kind === 'accelerometer' ? Accelerometer : Gyroscope;
  const [value, setValue] = useState<Vector3 | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const subscription = useRef<{ remove: () => void } | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const session = useRef(0);
  const starting = useRef(false);

  const stop = useCallback(() => {
    // Las respuestas de permisos y lecturas de una sesión anterior dejan de ser válidas.
    session.current += 1;
    subscription.current?.remove();
    subscription.current = null;
    if (timeout.current) clearTimeout(timeout.current);
    starting.current = false;
    setActive(false);
    setBusy(false);
  }, []);

  const foreground = useForeground(stop);
  useEffect(
    () => () => {
      session.current += 1;
      subscription.current?.remove();
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );

  async function start() {
    if (starting.current || subscription.current || !foreground) return;
    starting.current = true;
    const run = ++session.current;
    setBusy(true);
    setError('');
    setValue(null);
    setHistory([]);
    try {
      // En Safari el permiso debe originarse directamente en la pulsación del usuario.
      const permission = await sensor.requestPermissionsAsync();
      if (run !== session.current) return;
      if (!permission.granted)
        throw new Error('Habilitá el permiso de movimiento en los ajustes y volvé a intentar.');
      if (!(await sensor.isAvailableAsync()))
        throw new Error(
          'Este dispositivo o navegador no dispone de este sensor. Probá la app en un teléfono compatible.',
        );
      if (run !== session.current) return;
      sensor.setUpdateInterval(100);
      subscription.current = sensor.addListener(({ x, y, z }) => {
        if (run !== session.current || ![x, y, z].every(Number.isFinite)) return;
        if (timeout.current) {
          clearTimeout(timeout.current);
          timeout.current = null;
        }
        setValue({ x, y, z });
        // El gráfico conserva las últimas 40 magnitudes; no acumula toda la sesión.
        setHistory((previous) => [...previous.slice(-39), Math.hypot(x, y, z)]);
      });
      setActive(true);
      timeout.current = setTimeout(() => {
        if (run !== session.current) return;
        stop();
        setError('El sensor no envió datos. Revisá los permisos o probá en un teléfono físico.');
      }, 6000);
    } catch (cause) {
      if (run !== session.current) return;
      stop();
      setError(
        cause instanceof Error ? cause.message : 'No se pudo iniciar el sensor. Volvé a intentar.',
      );
    } finally {
      if (run === session.current) {
        starting.current = false;
        setBusy(false);
      }
    }
  }
  return { value, history, active, busy, error, start, stop };
}
