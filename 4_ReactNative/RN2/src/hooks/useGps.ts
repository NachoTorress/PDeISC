import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { createGpsSession, INITIAL_GPS_STATE } from '../services/gpsSession';

/** Estado de React ↔ sesión GPS. El desmontaje siempre libera la suscripción nativa. */
export function useGps() {
  const [state, setState] = useState(INITIAL_GPS_STATE);
  const [session] = useState(() =>
    createGpsSession(
      Location,
      Platform.OS === 'android',
      AppState.currentState === 'active' || AppState.currentState === null,
      setState,
    ),
  );
  useEffect(() => {
    const listener = AppState.addEventListener('change', session.onAppStateChange);
    return () => {
      listener.remove();
      session.dispose();
    };
  }, [session]);
  return { ...state, start: session.start, stop: session.stop };
}
