import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Icon, type IconName } from './Icon';
import { Type } from './Typography';

type Props = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  busy?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  busy,
  disabled,
  compact,
  style,
}: Props) {
  const { colors } = useTheme();
  const foreground =
    variant === 'primary' ? colors.onAccent : variant === 'danger' ? colors.error : colors.text;
  const background =
    variant === 'primary'
      ? colors.accent
      : variant === 'secondary'
        ? colors.raised
        : variant === 'danger'
          ? colors.errorBg
          : 'transparent';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled || !!busy, busy: !!busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.button,
        {
          backgroundColor: background,
          opacity: disabled ? 0.5 : pressed ? 0.85 : hovered ? 0.94 : 1,
          paddingHorizontal: compact ? 12 : 18,
        },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator
          size="small"
          color={foreground}
          accessible={false}
          style={{ width: 19, height: 20 }}
        />
      ) : icon ? (
        <Icon name={icon} size={19} color={foreground} strokeWidth={2} />
      ) : null}
      <Type size={14} weight="semibold" style={{ color: foreground, flexShrink: 1 }}>
        {label}
      </Type>
    </Pressable>
  );
}

export function IconButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: hovered || pressed ? colors.raised : colors.surface,
      })}
    >
      <Icon name={icon} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    minWidth: 48,
    maxWidth: '100%',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    flexShrink: 1,
  },
});
