/**
 * Paletas de color (claro suave / oscuro).
 * Origen: ThemeContext. Destino: todos los componentes vía useTheme().
 */
export type Palette = {
  bg: string; card: string; text: string; muted: string;
  primary: string; onPrimary: string; border: string; danger: string;
};

export const lightPalette: Palette = {
  bg: '#F1EFE9', card: '#FAF9F5', text: '#2A2B2E', muted: '#6A6D73',
  primary: '#4F46E5', onPrimary: '#FFFFFF', border: '#DAD6CB', danger: '#C62828',
};

export const darkPalette: Palette = {
  bg: '#111418', card: '#1B2027', text: '#ECEFF4', muted: '#A0A8B4',
  primary: '#9AA1FF', onPrimary: '#10121A', border: '#2C333D', danger: '#FF6B6B',
};
