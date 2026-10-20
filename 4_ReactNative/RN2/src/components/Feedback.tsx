import { View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Type } from './Typography';
import { Icon } from './Icon';

export function Feedback({ message, success = false }: { message: string; success?: boolean }) {
  const { colors } = useTheme();
  if (!message) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        backgroundColor: success ? colors.successBg : colors.errorBg,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
      }}
    >
      <Icon
        name={success ? 'check' : 'help'}
        color={success ? colors.success : colors.error}
        size={20}
      />
      <Type size={14} style={{ color: success ? colors.success : colors.error, flex: 1 }}>
        {message}
      </Type>
    </View>
  );
}
