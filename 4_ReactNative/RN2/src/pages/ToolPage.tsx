import { View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { toolById } from '../constants/tools';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Type } from '../components/Typography';
import { CameraTool } from './tools/CameraTool';
import { MotionTool } from './tools/MotionTool';
import { LocationTool } from './tools/LocationTool';
import { BiometricsTool } from './tools/BiometricsTool';
import type { ToolId } from '../types';

export function ToolPage({ id, back }: { id: ToolId; back: () => void }) {
  const { colors } = useTheme();
  const tool = toolById(id);
  return (
    <View style={{ gap: 24 }}>
      <Button
        label="Todas las herramientas"
        icon="arrowLeft"
        variant="ghost"
        compact
        onPress={back}
      />
      <View style={{ gap: 12 }}>
        <Icon name={id} color={colors.accent} size={36} />
        <Type
          accessibilityRole="header"
          size={36}
          weight="semibold"
          style={{ letterSpacing: -0.8 }}
        >
          {tool.title}
        </Type>
        <Type tone="muted" style={{ maxWidth: 760 }}>
          {tool.detail}
        </Type>
      </View>
      <View style={{ backgroundColor: colors.surface, padding: 22, borderRadius: 16, gap: 22 }}>
        {id === 'camera' && <CameraTool />}
        {id === 'scanner' && <CameraTool scanner />}
        {id === 'location' && <LocationTool />}
        {(id === 'accelerometer' || id === 'gyroscope') && <MotionTool key={id} kind={id} />}
        {id === 'biometrics' && <BiometricsTool />}
      </View>
    </View>
  );
}
