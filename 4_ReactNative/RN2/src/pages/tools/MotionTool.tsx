import { useState } from 'react';
import { Platform, View } from 'react-native';
import { useMotionSensor } from '../../hooks/useMotionSensor';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Type } from '../../components/Typography';
import { Feedback } from '../../components/Feedback';
import { SensorPlot } from '../../components/SensorPlot';
import { RecordComposer } from '../../components/RecordComposer';
import type { RecordPayload } from '../../types';

export function MotionTool({ kind }: { kind: 'accelerometer' | 'gyroscope' }) {
  const { colors } = useTheme();
  // El adaptador web de Expo no conserva las magnitudes y unidades de estos sensores.
  // Separar el componente evita iniciar suscripciones o guardar lecturas incorrectas.
  if (Platform.OS === 'web')
    return (
      <View style={{ gap: 18 }}>
        <Icon name="phone" size={48} color={colors.accent} />
        <Type size={24} weight="semibold">
          Probá este sensor en tu teléfono
        </Type>
        <Type tone="muted">
          Instalá la APK de Pulso para usar el{' '}
          {kind === 'accelerometer' ? 'acelerómetro' : 'giroscopio'} del dispositivo y guardar sus
          mediciones. Esta prueba está disponible en la aplicación nativa.
        </Type>
      </View>
    );
  return <NativeMotionTool kind={kind} />;
}

function NativeMotionTool({ kind }: { kind: 'accelerometer' | 'gyroscope' }) {
  const { colors } = useTheme();
  const { value, history, active, busy, error, start, stop } = useMotionSensor(kind);
  const [snapshot, setSnapshot] = useState<RecordPayload | null>(null);
  const [version, setVersion] = useState(0);
  const unit = kind === 'accelerometer' ? 'g' : 'rad/s';
  function capture() {
    if (!value) return;
    stop();
    setSnapshot({ kind, vector: { ...value }, unit });
    setVersion((previous) => previous + 1);
  }
  return (
    <View style={{ gap: 24 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: active ? colors.accent : colors.muted,
          }}
        />
        <Type size={14} weight="medium">
          {busy
            ? 'Buscando el sensor…'
            : active
              ? 'Midiendo en tiempo real · 10 Hz'
              : value
                ? 'Lectura pausada'
                : 'Listo para empezar'}
        </Type>
      </View>
      <Feedback message={error} />
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        {(['x', 'y', 'z'] as const).map((axis) => (
          <View
            key={axis}
            style={{
              flex: 1,
              minWidth: 85,
              padding: 20,
              backgroundColor: colors.raised,
              borderRadius: 12,
            }}
          >
            <Type size={13} tone="muted">
              Eje {axis.toUpperCase()}
            </Type>
            <Type size={30} weight="semibold" style={{ fontVariant: ['tabular-nums'] }}>
              {value ? value[axis].toFixed(3) : '—'}
            </Type>
            <Type size={13} tone="muted">
              {unit}
            </Type>
          </View>
        ))}
      </View>
      <SensorPlot values={history} unit={unit} />
      <Type size={13} tone="muted">
        Los valores negativos indican la dirección del movimiento.{' '}
        {kind === 'accelerometer'
          ? 'En reposo, la magnitud suele rondar 1 g por la gravedad.'
          : 'En reposo, los tres ejes suelen estar cerca de cero.'}
      </Type>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        {active ? (
          <Button label="Pausar medición" icon="pause" onPress={stop} />
        ) : (
          <Button
            label={value ? 'Nueva medición' : 'Iniciar medición'}
            icon="play"
            busy={busy}
            onPress={() => {
              setSnapshot(null);
              void start();
            }}
          />
        )}
        {value && !snapshot && (
          <Button
            label="Conservar esta lectura"
            icon="check"
            variant="secondary"
            onPress={capture}
          />
        )}
        {busy && <Button label="Cancelar" variant="ghost" onPress={stop} />}
      </View>
      {snapshot && (
        <RecordComposer
          key={version}
          payload={snapshot}
          title={kind === 'accelerometer' ? 'Lectura del acelerómetro' : 'Lectura del giroscopio'}
        />
      )}
    </View>
  );
}
