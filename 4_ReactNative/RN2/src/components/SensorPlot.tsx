import Svg, { Line, Polyline } from 'react-native-svg';
import { View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Type } from './Typography';

/** Traza real de magnitud; el mínimo y máximo rotulan la escala dinámica. */
export function SensorPlot({ values, unit }: { values: number[]; unit: string }) {
  const { colors } = useTheme();
  const max = Math.max(0.1, ...values) * 1.1;
  const points = values
    .map((value, index) => `${16 + (index / 39) * 568},${156 - (value / max) * 132}`)
    .join(' ');
  return (
    <View style={{ backgroundColor: colors.background, borderRadius: 12, padding: 16, gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Type size={13} tone="muted">
          Magnitud · últimas 40 muestras
        </Type>
        <Type size={13} tone="muted">
          0 – {max.toFixed(2)} {unit}
        </Type>
      </View>
      <Svg
        width="100%"
        height={170}
        viewBox="0 0 600 170"
        accessibilityLabel="Gráfico de magnitud del sensor. Los valores de cada eje están disponibles como texto."
      >
        {[24, 68, 112, 156].map((y) => (
          <Line key={y} x1={16} x2={584} y1={y} y2={y} stroke={colors.line} strokeWidth={1} />
        ))}
        {values.length > 1 && (
          <Polyline
            points={points}
            fill="none"
            stroke={colors.accent}
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
      </Svg>
      {!values.length && (
        <Type size={13} tone="muted">
          El gráfico aparecerá al recibir mediciones.
        </Type>
      )}
    </View>
  );
}
