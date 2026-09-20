export const theme = {
  colors: {
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
    accent: 'var(--color-accent)',
    light: 'var(--color-title)',
    text: 'var(--color-text)',
    textLight: 'var(--color-text)',
    textDark: 'var(--color-text-inverted)',
    glass: {
      background: 'var(--glass-background)',
      border: 'var(--glass-border)',
      card: 'var(--glass-card)',
    },
    gradient: {
      main: 'var(--gradient-main)',
      accent: 'var(--gradient-accent)',
      glass: 'var(--gradient-glass)',
    },
    overlay: {
      light: 'var(--overlay-light)',
      dark: 'var(--overlay-dark)',
    }
  },
  fonts: {
    body: "'Inter', sans-serif",
    heading: "'Poppins', sans-serif",
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '2rem',
    xl: '4rem',
  },
  transitions: {
    default: '0.3s ease',
  },
};

export type Theme = typeof theme;
