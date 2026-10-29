/**
 * Componente raíz de ExpoTec.
 *
 * Arma los proveedores de contexto (tema, sesión y demostración) y la
 * estructura visible: barra superior, menú de navegación, franja de la
 * demostración y pila de pantallas (React Navigation).
 *
 * Las piezas de la navegación están en `components/navigation/`:
 * - `AppHeader`: barra superior con menú hamburguesa, cuenta y tema.
 * - `DemoBar`: perfil ficticio y aviso de la demostración.
 * - `RootStack`: pila de pantallas; `HomeTabs`: pestañas de la demostración.
 * - `navigationItems`: opciones del menú según los permisos de la cuenta.
 * El menú lateral se adapta al ancho (hamburguesa en teléfonos, fijo desde 1200 px).
 */
import { useEffect, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaInsetsContext,
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  useNavigationContainerRef,
  StackActions,
} from "@react-navigation/native";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { DemoProvider } from "./contexts/DemoContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useDemo } from "./hooks/useDemo";
import { hasSocialReturn, socialBridge } from "./lib/socialBridge";
import { passwordReset } from "./lib/passwordReset";
import { AppNavigation } from "./components/AppNavigation";
import { KeyboardRoot } from "./components/KeyboardLayout";
import { SystemNavigation } from "./components/SystemNavigation";
import { AppHeader } from "./components/navigation/AppHeader";
import { DemoBar } from "./components/navigation/DemoBar";
import { RootStack } from "./components/navigation/RootStack";
import { navigationItems } from "./components/navigation/navigationItems";
import type { RootRoutes, SectionRoute } from "./components/navigation/routes";

/** Raíz: proveedores de área segura, tema, sesión, demostración y teclado. */
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <DemoProvider>
            <KeyboardRoot>
              <AppShell />
            </KeyboardRoot>
          </DemoProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
/** Estructura visible: barra superior, menú de navegación, aviso de sesión y pila de pantallas. */
function AppShell() {
  const { colors } = useTheme();
  const { role, setRole } = useDemo();
  const { user } = useAuth();
  const [menu, setMenu] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState("SharedSpaces");
  const [remoteOpen, setRemoteOpen] = useState(true);
  const [startInDemo, setStartInDemo] = useState(false);
  const navigation = useNavigationContainerRef<RootRoutes>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const desktopNavigation = width >= 1200 && remoteOpen;
  useEffect(() => {
    setNavigationOpen(false);
  }, [desktopNavigation]);
  /** Cierra el selector de perfiles y abre una sección. */
  const openSection = (route: SectionRoute) => {
    setMenu(false);
    if (navigation.isReady()) navigation.navigate(route);
  };
  const updateNavigation = () => {
    const route = navigation.getCurrentRoute()?.name ?? "SharedSpaces";
    const shared =
      route.startsWith("Shared") ||
      route === "Account" ||
      route === "AdminUsers";
    setActiveRoute(
      !shared
        ? "Home"
        : route === "SharedProject" || route === "SharedProposal"
          ? "SharedProjects"
          : route,
    );
    setRemoteOpen(shared);
  };
  const navTheme = {
    ...(colors.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(colors.dark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.page,
      card: colors.surface,
      text: colors.text,
      border: colors.outline,
      primary: colors.primary,
    },
  };
  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.page }}
    >
      <StatusBar style={colors.dark ? "light" : "dark"} />
      <SystemNavigation />
      <AppHeader
        desktopNavigation={desktopNavigation}
        navigationOpen={navigationOpen}
        onOpenNavigation={() => setNavigationOpen(true)}
        onSignIn={() => openSection("Account")}
      />
      {!remoteOpen && (
        <DemoBar
          menu={menu}
          onToggleMenu={() => setMenu(!menu)}
          onChooseProfile={(next) => {
            setStartInDemo(true);
            setRole(next);
            setMenu(false);
          }}
          onShared={() => {
            setMenu(false);
            navigation.dispatch(StackActions.popTo("SharedSpaces"));
          }}
        />
      )}
      <View style={{ flex: 1, flexDirection: "row" }}>
        <AppNavigation
          items={navigationItems(user, openSection)}
          activeId={activeRoute}
          desktop={desktopNavigation}
          open={navigationOpen && !desktopNavigation}
          onClose={() => setNavigationOpen(false)}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          {/* La barra global ya ocupa el margen superior seguro del teléfono. */}
          <SafeAreaInsetsContext.Provider value={{ ...insets, top: 0 }}>
            <NavigationContainer
              ref={navigation}
              theme={navTheme}
              key={role}
              onReady={updateNavigation}
              onStateChange={updateNavigation}
            >
              <RootStack
                role={role}
                initialRouteName={
                  hasSocialReturn ||
                  socialBridge.pending() ||
                  passwordReset.pending() !== null
                    ? "Account"
                    : startInDemo
                      ? "Home"
                      : "SharedSpaces"
                }
              />
            </NavigationContainer>
          </SafeAreaInsetsContext.Provider>
        </View>
      </View>
    </SafeAreaView>
  );
}
