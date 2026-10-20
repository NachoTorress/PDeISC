import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Camera,
  Check,
  ChevronRight,
  CircleHelp,
  Fingerprint,
  Focus,
  Grid2X2,
  History,
  MapPin,
  Moon,
  Navigation,
  Pause,
  Play,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  X,
  Pencil,
  Activity,
  Orbit,
  Settings,
  LocateFixed,
  Copy,
  LockKeyhole,
} from 'lucide-react-native';
import type { ToolId } from '../types';

const icons = {
  arrowDown: ArrowDown,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  camera: Camera,
  check: Check,
  chevronRight: ChevronRight,
  help: CircleHelp,
  biometrics: Fingerprint,
  focus: Focus,
  grid: Grid2X2,
  history: History,
  location: MapPin,
  moon: Moon,
  navigation: Navigation,
  pause: Pause,
  play: Play,
  rotate: RotateCcw,
  scanner: ScanLine,
  shield: ShieldCheck,
  phone: Smartphone,
  sun: Sun,
  trash: Trash2,
  close: X,
  edit: Pencil,
  accelerometer: Activity,
  gyroscope: Orbit,
  settings: Settings,
  locate: LocateFixed,
  copy: Copy,
  lock: LockKeyhole,
};
export type IconName = keyof typeof icons;

export function Icon({
  name,
  color,
  size = 22,
  strokeWidth = 1.7,
}: {
  name: IconName | ToolId;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const Component = icons[name];
  return <Component size={size} color={color} strokeWidth={strokeWidth} accessible={false} />;
}
