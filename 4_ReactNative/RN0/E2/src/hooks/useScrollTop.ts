import { useRef, useState, useCallback } from 'react';
import { ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

/** Lógica del botón "subir". Origen: HomeScreen (ref y onScroll). Destino: expone visible y goTop. */
export function useScrollTop(threshold = 300) {
  const ref = useRef<ScrollView>(null);
  const [visible, setVisible] = useState(false);
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => setVisible(e.nativeEvent.contentOffset.y > threshold),
    [threshold]
  );
  const goTop = useCallback(() => ref.current?.scrollTo({ y: 0, animated: true }), []);
  return { ref, visible, onScroll, goTop };
}
