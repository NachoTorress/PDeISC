import { Text, type TextProps } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

type Props = TextProps & {
  tone?: 'default' | 'muted';
  size?: number;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
};
const fonts = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
};

export function Type({ tone = 'default', size = 16, weight = 'regular', style, ...props }: Props) {
  const { colors } = useTheme();
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: fonts[weight],
          fontSize: size,
          lineHeight: size * 1.45,
          color: tone === 'muted' ? colors.muted : colors.text,
        },
        style,
      ]}
    />
  );
}
