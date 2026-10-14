import Svg, { Circle, Path, Rect } from "react-native-svg";
import { Platform } from "react-native";

const paths = {
  map: "M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2V5M9 3v16M15 5v16",
  projects: "M4 6h16v14H4V6M8 6V3h8v3M4 11h16M9 11v3h6v-3",
  loans: "M3 12h14M13 8l4 4-4 4M6 6V3h15v18H6v-3",
  inventory: "M3 7l9-4 9 4-9 4-9-4M3 7v10l9 4 9-4V7M12 11v10",
  gallery: "M3 4h18v16H3V4M3 16l5-5 4 4 4-6 5 7",
  tv: "M4 6h16v13H4V6M8 3l4 3 4-3M8 22h8",
  sun: "M12 1v2M12 21v2M1 12h2M21 12h2M4 4l2 2M18 18l2 2M20 4l-2 2M6 18l-2 2",
  moon: "M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11",
  menu: "M4 6h16M4 12h16M4 18h16",
  plant:
    "M12 22V11M12 16C3 16 2 10 3 5c7 0 10 4 9 11M12 12c0-7 5-9 9-9 0 6-3 9-9 9",
  energy: "M14 2L4 14h7l-1 8 10-12h-7l1-8",
  robot: "M12 7V3M1 11v7M23 11v7M8 17h8",
  weather:
    "M5 15a5 5 0 1 1 8-7 4 4 0 1 1 5 7H5M8 19l-1 3M13 19l-1 3M18 19l-1 3",
  plus: "M12 5v14M5 12h14",
  table: "M3 7h18v5H3V7M5 12v8M19 12v8M5 17h14",
  bench: "M4 5h16v7H4V5M2 12h20v4H2v-4M5 16v4M19 16v4M8 5v7M16 5v7",
  power: "M8 3v5M16 3v5M6 8h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8M12 17v5",
  label: "M3 5h18v14H3V5M8 9h8M12 9v6M10 15h4",
  drag: "M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01",
  move: "M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3",
  rotate: "M20 11a8 8 0 1 0-2 7M20 4v7h-7",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
  edit: "M16 3l5 5-12 12-6 1 1-6L16 3M13 6l5 5",
  save: "M4 3h13l4 4v14H3V3h1M7 3v6h10V3M7 21v-8h10v8M14 3v3",
  close: "M5 5l14 14M19 5L5 19",
  check: "M4 12l5 5L20 6",
  arrowLeft: "M20 12H4M10 6l-6 6 6 6",
  arrowRight: "M4 12h16M14 6l6 6-6 6",
  arrowUp: "M12 20V4M6 10l6-6 6 6",
  arrowDown: "M12 4v16M6 14l6 6 6-6",
  external: "M14 3h7v7M21 3L10 14M10 3H3v18h18v-7",
  github:
    "M9 21v-3c-4 .6-4-2-6-3M15 21v-3a3 3 0 0 0-1-2c4-.5 7-2 7-6a6 6 0 0 0-1-3V3l-4 2a14 14 0 0 0-8 0L4 3v4a6 6 0 0 0-1 3c0 4 3 5.5 7 6a3 3 0 0 0-1 2",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2",
  play: "M8 4l12 8-12 8V4",
  pause: "M6 4h4v16H6V4M14 4h4v16h-4V4",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  chevronDown: "M6 9l6 6 6-6",
  chevronUp: "M6 15l6-6 6 6",
  logout: "M9 3H3v18h6M9 12h12M16 7l5 5-5 5",
  image: "M3 4h18v16H3V4M3 16l5-5 4 4 4-6 5 7",
  fullscreen: "M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6",
  download: "M12 3v12M7 10l5 5 5-5M3 15v6h18v-6",
  upload: "M12 17V3M7 8l5-5 5 5M3 15v6h18v-6",
  undo: "M3 10h11a7 7 0 0 1 7 7v4M8 5l-5 5 5 5",
  redo: "M21 10H10a7 7 0 0 0-7 7v4M16 5l5 5-5 5",
  refresh:
    "M20 11a8 8 0 0 0-14-5L3 9M3 3v6h6M4 13a8 8 0 0 0 14 5l3-3M21 21v-6h-6",
  info: "M12 11v6M12 7h.01",
  alert: "M12 3L2 21h20L12 3M12 9v5M12 17h.01",
  zoomIn: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0M6 10h8M10 6v8",
  zoomOut: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0M6 10h8",
} as const;

export type IconName = keyof typeof paths;

/** Una biblioteca vectorial compartida: todos los símbolos usan la misma cuadrícula y trazo. */
export function Icon({
  name,
  color,
  size = 24,
}: {
  name: IconName;
  color: string;
  size?: number;
}) {
  const path = typeof paths[name] === "string" ? paths[name] : paths.projects;
  const accessibility = Platform.OS === "web" ? { "aria-hidden": true } : { accessible: false };
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...accessibility}
      focusable={false}
    >
      <Path d={path} />
      {name === "robot" && (
        <>
          <Rect x="4" y="7" width="16" height="14" rx="3" />
          <Circle cx="8" cy="12" r="1" />
          <Circle cx="16" cy="12" r="1" />
          <Circle cx="12" cy="2" r="1" />
        </>
      )}
      {name === "sun" && <Circle cx="12" cy="12" r="5" />}
      {(name === "gallery" || name === "image") && (
        <Circle cx="8" cy="8" r="1" />
      )}
      {name === "users" && <Circle cx="9" cy="7" r="4" />}
      {name === "info" && <Circle cx="12" cy="12" r="10" />}
    </Svg>
  );
}
