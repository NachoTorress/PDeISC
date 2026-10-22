import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { useColorScheme } from "react-native";
import { light, type Palette } from "../theme/light";
import { dark } from "../theme/dark";
const ThemeContext = createContext<{ colors: Palette; toggle: () => void }>({
  colors: light,
  toggle: () => {},
});
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [choice, setChoice] = useState<"light" | "dark" | null>(null);
  const isDark = choice ? choice === "dark" : system === "dark";
  const toggle = () => {
    const next = isDark ? "light" : "dark";
    setChoice(next);
  };
  return (
    <ThemeContext.Provider value={{ colors: isDark ? dark : light, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  return useContext(ThemeContext);
}
