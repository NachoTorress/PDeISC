import { useState } from 'react';
import { Image, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Type } from './Typography';
import { formatDate, formatTime } from '../utils/format';
import type { RecordPayload } from '../types';

export function RecordPayloadView({ payload }: { payload: RecordPayload }) {
  const { colors } = useTheme();
  const [photoError, setPhotoError] = useState(false);
  switch (payload.kind) {
    case 'camera':
      return photoError ? (
        <Type tone="muted">La imagen ya no está disponible en el dispositivo.</Type>
      ) : (
        <Image
          source={{ uri: payload.uri }}
          onError={() => setPhotoError(true)}
          accessibilityLabel="Foto guardada en este registro"
          resizeMode="contain"
          style={{ width: '100%', height: 220, borderRadius: 12, backgroundColor: colors.raised }}
        />
      );
    case 'scanner':
      return (
        <View style={{ gap: 4 }}>
          <Type size={12} tone="muted">
            {payload.format.toUpperCase()}
          </Type>
          <Type selectable>{payload.content}</Type>
        </View>
      );
    case 'location':
      return (
        <View style={{ gap: 4 }}>
          <Type selectable weight="medium">
            {payload.latitude.toFixed(6)}, {payload.longitude.toFixed(6)}
          </Type>
          <Type size={13} tone="muted">
            Precisión:{' '}
            {payload.accuracy === null ? 'no informada' : `±${Math.round(payload.accuracy)} m`}
            {payload.altitude === null ? '' : ` · Altitud: ${payload.altitude.toFixed(1)} m`}
          </Type>
        </View>
      );
    case 'accelerometer':
    case 'gyroscope':
      return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>
          {(['x', 'y', 'z'] as const).map((axis) => (
            <View key={axis}>
              <Type size={12} tone="muted">
                {axis.toUpperCase()}
              </Type>
              <Type selectable weight="medium">
                {payload.vector[axis].toFixed(3)} {payload.unit}
              </Type>
            </View>
          ))}
        </View>
      );
    case 'biometrics':
      return (
        <View style={{ gap: 4 }}>
          <Type weight="medium">{payload.method}</Type>
          <Type size={13} tone="muted">
            {formatDate(payload.verifiedAt)} a las {formatTime(payload.verifiedAt)}
          </Type>
        </View>
      );
  }
}
