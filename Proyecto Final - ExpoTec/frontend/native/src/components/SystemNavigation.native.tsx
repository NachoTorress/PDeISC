/** Android: oculta la barra inferior del sistema y la recupera con un deslizamiento. */
import { useEffect } from "react";
import { AppState, Keyboard, Platform } from "react-native";
import { NavigationBar, setVisibilityAsync } from "expo-navigation-bar";
import { useTheme } from "../contexts/ThemeContext";

export function SystemNavigation() {
  const { colors } = useTheme();
  useEffect(() => {
    if (Platform.OS !== "android") return;
    // El teclado puede cambiar la visibilidad fuera del estado que conserva el componente.
    const hide = () => { void setVisibilityAsync("hidden").catch(() => {}); };
    const keyboard = Keyboard.addListener("keyboardDidHide", hide);
    const state = AppState.addEventListener("change", (value) => { if (value === "active") hide(); });
    return () => { keyboard.remove(); state.remove(); };
  }, []);
  return Platform.OS === "android" ? <NavigationBar hidden style={colors.dark ? "light" : "dark"} /> : null;
}
