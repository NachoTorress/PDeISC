import { useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { useGps } from '../../hooks/useGps';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Type } from '../../components/Typography';
import { Feedback } from '../../components/Feedback';
import { RecordComposer } from '../../components/RecordComposer';
import { formatTime } from '../../utils/format';
import type { RecordPayload } from '../../types';

export function LocationTool() {
  const { colors } = useTheme();
  const { point, active, busy, error, blocked, start, stop } = useGps();
  const [snapshot, setSnapshot] = useState<RecordPayload | null>(null);
  const [version, setVersion] = useState(0);
  const [linkError, setLinkError] = useState('');
  async function openMap() {
    if (!point) return;
    const { latitude, longitude } = point.coords;
    try {
      await Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      );
    } catch {
      setLinkError('No se pudo abrir el mapa. Podés copiar las coordenadas desde el registro.');
    }
  }
  function capture() {
    if (!point) return;
    stop();
    const { latitude, longitude, accuracy, altitude } = point.coords;
    setSnapshot({ kind: 'location', latitude, longitude, accuracy, altitude });
    setVersion((previous) => previous + 1);
  }
  return (
    <View style={{ gap: 24 }}>
      <View style={{ backgroundColor: colors.raised, padding: 24, borderRadius: 16, gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name="locate" size={32} color={colors.accent} />
          <Type size={20} weight="semibold">
            {busy
              ? point
                ? 'Iniciando seguimiento…'
                : 'Buscando tu ubicación…'
              : active
                ? 'Seguimiento activo'
                : point
                  ? 'Última posición recibida'
                  : 'Tu próximo punto de partida'}
          </Type>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
          <View style={{ flex: 1, minWidth: 170 }}>
            <Type size={13} tone="muted">
              Latitud
            </Type>
            <Type selectable size={30} weight="semibold">
              {point ? point.coords.latitude.toFixed(6) : '—'}
            </Type>
          </View>
          <View style={{ flex: 1, minWidth: 170 }}>
            <Type size={13} tone="muted">
              Longitud
            </Type>
            <Type selectable size={30} weight="semibold">
              {point ? point.coords.longitude.toFixed(6) : '—'}
            </Type>
          </View>
        </View>
        <Type size={14} tone="muted">
          {point
            ? `Precisión: ${point.coords.accuracy === null ? 'no informada' : `±${Math.round(point.coords.accuracy)} m`} · Actualizado a las ${formatTime(new Date(point.timestamp).toISOString())}`
            : 'La primera posición puede tardar hasta 30 segundos.'}
        </Type>
        {point?.coords.altitude != null && (
          <Type size={14} tone="muted">
            Altitud: {point.coords.altitude.toFixed(1)} m sobre el nivel del mar
          </Type>
        )}
      </View>
      <Feedback message={error || linkError} />
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        {active || busy ? (
          <Button label="Detener GPS" icon="pause" onPress={stop} />
        ) : (
          <Button
            label={point ? 'Actualizar ubicación' : 'Iniciar GPS'}
            icon="navigation"
            onPress={() => {
              setSnapshot(null);
              void start();
            }}
          />
        )}
        {point && !snapshot && (
          <Button label="Conservar este punto" icon="check" variant="secondary" onPress={capture} />
        )}
        {point && (
          <Button
            label="Abrir en mapas"
            icon="location"
            variant="ghost"
            onPress={() => {
              void openMap();
            }}
          />
        )}
        {blocked && Platform.OS !== 'web' && (
          <Button
            label="Abrir ajustes"
            icon="settings"
            variant="secondary"
            onPress={() => {
              void Linking.openSettings().catch(() =>
                setLinkError('Habilitá la ubicación en los ajustes del dispositivo.'),
              );
            }}
          />
        )}
      </View>
      <Type size={13} tone="muted">
        La ubicación se consulta solo en primer plano. Para un punto más preciso, esperá una señal
        estable al aire libre. Abrir mapas utiliza una aplicación externa y puede necesitar
        Internet.
      </Type>
      {snapshot && <RecordComposer key={version} payload={snapshot} title="Mi ubicación" />}
    </View>
  );
}
