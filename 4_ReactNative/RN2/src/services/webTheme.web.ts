import '../styles/global.css';
import type { ThemeMode } from '../types';

export function applyWebTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode;
  document.title = 'Pulso · Laboratorio del dispositivo';
  const root = document.querySelector('#root');
  root?.classList.add('root');
  document.documentElement.lang = 'es';
}
