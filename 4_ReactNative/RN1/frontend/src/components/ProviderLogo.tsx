import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import type { Palette } from '../styles/theme';

export type Provider = 'google' | 'discord' | 'github';

export const providerLabel: Record<Provider, string> = {
  google: 'Google',
  discord: 'Discord',
  github: 'GitHub'
};

export function ProviderLogo({ provider, palette, size }: { provider: Provider; palette: Palette; size: number }) {
  const color = provider === 'google' ? '#4285F4' : provider === 'discord' ? '#5865F2' : palette.text;
  return <FontAwesome5 name={provider} brand size={size} color={color} />;
}
