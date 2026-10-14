import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { light, type Palette } from "../theme/light";
import { dark } from "../theme/dark";
const ThemeContext = createContext<{ colors: Palette; toggle: () => void }>({
  colors: light,
  toggle: () => {},
});
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [choice, setChoice] = useState<string | null>(null);
  useEffect(() => {
    AsyncStorage.getItem("expotec-theme")
      .then(setChoice)
      .catch(() => {});
  }, []);
  const isDark = choice ? choice === "dark" : system === "dark";
  const toggle = () => {
    const next = isDark ? "light" : "dark";
    setChoice(next);
    void AsyncStorage.setItem("expotec-theme", next).catch(() => {});
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
