import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  useNavigation,
  useNavigationContainerRef,
  StackActions,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { DemoProvider } from "./contexts/DemoContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useDemo } from "./hooks/useDemo";
import { Button } from "./components/ui";
import { Icon } from "./components/Icon";
import type { IconName } from "./components/Icon";
import type { Role } from "./lib/types";
import MapPage from "./pages/MapPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectFormPage from "./pages/ProjectFormPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import LoansPage from "./pages/LoansPage";
import InventoryPage from "./pages/InventoryPage";
import GalleryPage from "./pages/GalleryPage";
import PresentationPage from "./pages/PresentationPage";
import AccountPage from "./pages/AccountPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import SharedGalleryPage from "./pages/SharedGalleryPage";
import DemoGalleryPage from "./pages/DemoGalleryPage";
import SharedSpacesPage from "./pages/SharedSpacesPage";
import SharedProjectsPage from "./pages/SharedProjectsPage";
import SharedProjectPage from "./pages/SharedProjectPage";
import SharedProposalPage from "./pages/SharedProposalPage";
import SharedInventoryPage from "./pages/SharedInventoryPage";
import SharedLoansPage from "./pages/SharedLoansPage";
import SharedPresentationPage from "./pages/SharedPresentationPage";
import { hasSocialReturn, socialBridge } from "./lib/socialBridge";
import { passwordReset } from "./lib/passwordReset";
import { AppNavigation } from "./components/AppNavigation";
import type { NavigationItem } from "./components/AppNavigation";

type RootRoutes = {
  Home: undefined;
  Detail: { projectId: string };
  Form: { projectId?: string } | undefined;
  Presentation: undefined;
  Account: undefined;
  AdminUsers: undefined;
  SharedGallery: undefined;
  SharedSpaces: undefined;
  SharedProjects: undefined;
  SharedProject: { projectId: string; privateView?: boolean };
  SharedProposal: { projectId?: string } | undefined;
  SharedInventory: undefined;
  SharedLoans: undefined;
  SharedPresentation: undefined;
};
type TabRoutes = {
  map: undefined;
  projects: undefined;
  loans: undefined;
  inventory: undefined;
  gallery: undefined;
  photos: undefined;
  tv: undefined;
};
const Stack = createNativeStackNavigator<RootRoutes>();
const Tabs = createBottomTabNavigator<TabRoutes>();
type Destination = {
  id: keyof TabRoutes;
  label: string;
  icon: IconName;
  roles: Role[];
};
const destinations: Destination[] = [
  {
    id: "map",
    label: "Espacios",
    icon: "map",
    roles: ["admin", "student", "teacher", "loans", "guest"],
  },
  {
    id: "projects",
    label: "Proyectos",
    icon: "projects",
    roles: ["admin", "student", "teacher"],
  },
  { id: "loans", label: "Préstamos", icon: "loans", roles: ["admin", "loans"] },
  {
    id: "inventory",
    label: "Inventario",
    icon: "inventory",
    roles: ["admin", "loans"],
  },
  {
    id: "gallery",
    label: "Muestra",
    icon: "gallery",
    roles: ["admin", "student", "teacher", "loans", "guest"],
  },
  {
    id: "photos",
    label: "Galería",
    icon: "image",
    roles: ["admin", "student", "teacher", "loans", "guest"],
  },
  { id: "tv", label: "TV", icon: "tv", roles: ["guest"] },
];
const profiles: { role: Role; label: string; identity: string }[] = [
  { role: "student", label: "Estudiante", identity: "Lucía Fernández" },
  { role: "teacher", label: "Profesor", identity: "Martín García" },
  { role: "loans", label: "Préstamos", identity: "Responsable de elementos" },
  {
    role: "admin",
    label: "Organización",
    identity: "Administrador de ejemplo",
  },
  { role: "guest", label: "Invitado", identity: "Muestra pública" },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <DemoProvider>
            <AppShell />
          </DemoProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
function AppShell() {
  const { colors, toggle } = useTheme();
  const { role, setRole, notice } = useDemo();
  const { user } = useAuth();
  const [menu, setMenu] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState("SharedSpaces");
  const menuButton = useRef<View>(null);
  const [remoteOpen, setRemoteOpen] = useState(true);
  const [startInDemo, setStartInDemo] = useState(false);
  const navigation = useNavigationContainerRef<RootRoutes>();
  const { width } = useWindowDimensions();
  const profile = profiles.find((item) => item.role === role)!;
  const desktopNavigation = width >= 1200 && remoteOpen;
  useEffect(() => {
    setNavigationOpen(false);
  }, [desktopNavigation]);
  const openSection = (
    route:
      | "Account"
      | "SharedSpaces"
      | "SharedProjects"
      | "SharedGallery"
      | "SharedPresentation"
      | "SharedInventory"
      | "SharedLoans"
      | "AdminUsers"
      | "Home",
  ) => {
    setMenu(false);
    if (navigation.isReady()) navigation.navigate(route);
  };
  const navigationItems: NavigationItem[] = [
    {
      id: "SharedSpaces",
      label: "Espacios",
      icon: "map",
      onPress: () => openSection("SharedSpaces"),
    },
    {
      id: "SharedProjects",
      label: "Proyectos",
      icon: "projects",
      onPress: () => openSection("SharedProjects"),
    },
    {
      id: "SharedGallery",
      label: "Galería de la ExpoTec",
      icon: "gallery",
      onPress: () => openSection("SharedGallery"),
    },
    {
      id: "SharedPresentation",
      label: "Presentación TV",
      icon: "tv",
      onPress: () => openSection("SharedPresentation"),
    },
    ...(user?.roles.some((item) => item === "admin" || item === "loans")
      ? [
          {
            id: "SharedInventory",
            label: "Inventario",
            icon: "inventory" as const,
            onPress: () => openSection("SharedInventory"),
          },
          {
            id: "SharedLoans",
            label: "Préstamos",
            icon: "loans" as const,
            onPress: () => openSection("SharedLoans"),
          },
        ]
      : []),
    ...(user?.roles.includes("admin")
      ? [
          {
            id: "AdminUsers",
            label: "Usuarios y permisos",
            icon: "users" as const,
            onPress: () => openSection("AdminUsers"),
          },
        ]
      : []),
    {
      id: "Account",
      label: "Mi cuenta",
      icon: "users",
      onPress: () => openSection("Account"),
    },
    {
      id: "Home",
      label: "Demostración",
      icon: "play",
      onPress: () => openSection("Home"),
    },
  ];
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
      <View
        style={{
          minHeight: 60,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          paddingHorizontal: width > 700 ? 24 : 16,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderColor: colors.outline,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {!desktopNavigation && (
            <Pressable
              ref={menuButton}
              accessibilityRole="button"
              accessibilityLabel="Abrir menú de navegación"
              accessibilityState={{ expanded: navigationOpen }}
              onPress={() => {
                (
                  menuButton.current as unknown as { focus?: () => void }
                )?.focus?.();
                setNavigationOpen(true);
              }}
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="menu" color={colors.text} />
            </Pressable>
          )}
          <Text
            accessibilityRole="header"
            style={{
              color: colors.text,
              fontSize: 23,
              fontWeight: "700",
              letterSpacing: -0.6,
            }}
          >
            expotec<Text style={{ color: colors.primary }}>.</Text>
          </Text>
        </View>
        {width > 750 && (
          <Text style={{ color: colors.muted }}>Todo en su lugar.</Text>
        )}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            alignItems: "center",
            flexShrink: 1,
            minWidth: 0,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              colors.dark ? "Activar modo claro" : "Activar modo oscuro"
            }
            onPress={toggle}
            style={{
              minWidth: 48,
              minHeight: 48,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={colors.dark ? "sun" : "moon"} color={colors.text} />
          </Pressable>
        </View>
      </View>
      {menu && !remoteOpen && (
        <View
          style={{
            padding: 16,
            gap: 8,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderColor: colors.outline,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "600" }}>
            Probar vista como
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {profiles.map((item) => (
              <Button
                key={item.role}
                title={item.label}
                icon={item.role === role ? "check" : "users"}
                variant={item.role === role ? "primary" : "secondary"}
                onPress={() => {
                  setStartInDemo(true);
                  setRole(item.role);
                  setMenu(false);
                }}
              />
            ))}
          </View>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            Perfiles ficticios para probar datos locales. Los permisos de tu
            cuenta real se consultan desde Mi cuenta.
          </Text>
          <Button
            title="Ver espacios compartidos"
            variant="secondary"
            onPress={() => {
              setMenu(false);
              navigation.dispatch(StackActions.popTo("SharedSpaces"));
            }}
          />
        </View>
      )}
      {!remoteOpen && (
        <View
          style={{
            paddingHorizontal: width > 700 ? 32 : 18,
            paddingVertical: 8,
            backgroundColor: colors.surfaceVariant,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 12, flex: 1 }}>
            Demostración · {profile.identity}
          </Text>
          <Button
            title="Cambiar vista"
            variant="quiet"
            endIcon={menu ? "chevronUp" : "chevronDown"}
            onPress={() => setMenu(!menu)}
          />
        </View>
      )}
      {!!notice && !remoteOpen && (
        <View
          style={{
            paddingHorizontal: 18,
            paddingVertical: 12,
            backgroundColor: colors.surfaceVariant,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Icon name="check" color={colors.success} size={20} />
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: colors.text, flex: 1, lineHeight: 21 }}
          >
            {notice}
          </Text>
        </View>
      )}
      <View style={{ flex: 1, flexDirection: "row" }}>
        <AppNavigation
          items={navigationItems}
          activeId={activeRoute}
          desktop={desktopNavigation}
          open={navigationOpen && !desktopNavigation}
          onClose={() => setNavigationOpen(false)}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <NavigationContainer
            ref={navigation}
            theme={navTheme}
            key={role}
            onReady={updateNavigation}
            onStateChange={updateNavigation}
          >
            <Stack.Navigator
              initialRouteName={
                hasSocialReturn ||
                socialBridge.pending() ||
                passwordReset.pending() !== null
                  ? "Account"
                  : startInDemo
                    ? "Home"
                    : "SharedSpaces"
              }
              screenOptions={{
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.text,
                contentStyle: { backgroundColor: colors.page },
              }}
            >
              <Stack.Screen
                name="Home"
                component={HomeTabs}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="SharedSpaces"
                options={{ title: "Espacios compartidos" }}
              >
                {({ navigation }) => (
                  <SharedSpacesPage
                    onSelectProject={(id) =>
                      navigation.navigate("SharedProject", { projectId: id })
                    }
                  />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="SharedProjects"
                options={{ title: "Proyectos compartidos" }}
              >
                {({ navigation }) => (
                  <SharedProjectsPage
                    onSelect={(id, privateView) =>
                      navigation.navigate("SharedProject", {
                        projectId: id,
                        privateView,
                      })
                    }
                    onCreate={() => navigation.navigate("SharedProposal")}
                    onAccount={() => navigation.navigate("Account")}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="SharedProject"
                options={{ title: "Proyecto compartido" }}
              >
                {({ route, navigation }) => (
                  <SharedProjectPage
                    projectId={route.params.projectId}
                    privateView={!!route.params.privateView}
                    onEdit={() =>
                      navigation.navigate("SharedProposal", {
                        projectId: route.params.projectId,
                      })
                    }
                    onBack={() => navigation.popTo("SharedProjects")}
                    onAccount={() => navigation.navigate("Account")}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="SharedProposal"
                options={{ title: "Propuesta del equipo" }}
              >
                {({ route, navigation }) => (
                  <SharedProposalPage
                    projectId={route.params?.projectId}
                    onSaved={(id) =>
                      navigation.replace("SharedProject", {
                        projectId: id,
                        privateView: true,
                      })
                    }
                    onBack={() => navigation.goBack()}
                    onAccount={() => navigation.navigate("Account")}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="Account"
                component={AccountPage}
                options={{ title: "Mi cuenta" }}
              />
              <Stack.Screen
                name="AdminUsers"
                options={{ title: "Usuarios y permisos" }}
              >
                {({ navigation }) => (
                  <AdminUsersPage
                    onAccount={() => navigation.popTo("Account")}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="SharedGallery"
                options={{ title: "Galería de la ExpoTec" }}
              >
                {({ navigation }) => (
                  <SharedGalleryPage
                    onAccount={() => navigation.navigate("Account")}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Detail" options={{ title: "Proyecto" }}>
                {({ route, navigation }) => (
                  <ProjectDetailPage
                    projectId={route.params.projectId}
                    onBack={() => navigation.goBack()}
                    onEdit={(id) =>
                      navigation.navigate("Form", { projectId: id })
                    }
                  />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="SharedInventory"
                options={{ title: "Inventario compartido" }}
              >
                {({ navigation }) => (
                  <SharedInventoryPage
                    onAccount={() => navigation.navigate("Account")}
                  />
                )}
              </Stack.Screen>
              {role === "student" && (
                <Stack.Screen name="Form" options={{ title: "Propuesta" }}>
                  {({ route, navigation }) => (
                    <ProjectFormPage
                      projectId={route.params?.projectId}
                      onDone={() => navigation.goBack()}
                    />
                  )}
                </Stack.Screen>
              )}
              <Stack.Screen
                name="SharedLoans"
                options={{ title: "Préstamos compartidos" }}
              >
                {({ navigation }) => (
                  <SharedLoansPage
                    onAccount={() => navigation.navigate("Account")}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="SharedPresentation"
                options={{ title: "Presentación TV", headerShown: false }}
              >
                {({ navigation }) => (
                  <SharedPresentationPage
                    onBack={() => navigation.popTo("SharedProjects")}
                    onProject={(id) =>
                      navigation.navigate("SharedProject", { projectId: id })
                    }
                  />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="Presentation"
                options={{ headerShown: false }}
              >
                {({ navigation }) => (
                  <PresentationPage onBack={() => navigation.goBack()} />
                )}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      </View>
    </SafeAreaView>
  );
}

function HomeTabs() {
  const { role } = useDemo();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const root = useNavigation<NativeStackNavigationProp<RootRoutes>>();
  const visible = destinations.filter((item) => item.roles.includes(role));
  return (
    <Tabs.Navigator
      initialRouteName={
        role === "guest" ? "gallery" : role === "loans" ? "loans" : "map"
      }
      screenOptions={{
        headerShown: false,
        tabBarPosition: width >= 1000 ? "left" : "bottom",
        tabBarActiveTintColor: colors.primary,
        tabBarActiveBackgroundColor: colors.selectedContainer,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderColor: colors.outline,
          ...(width >= 1000
            ? { width: 184, minWidth: 184, paddingTop: 16 }
            : { minHeight: 60 }),
        },
        tabBarItemStyle: { minHeight: 52, height: 52 },
        tabBarButton: (props) => (
          <Pressable
            onPress={props.onPress}
            onLongPress={props.onLongPress}
            accessibilityLabel={props["aria-label"]}
            role={props.role}
            aria-selected={props["aria-selected"]}
            disabled={props.disabled}
            style={[props.style, { minHeight: 48 }]}
          >
            {props.children}
          </Pressable>
        ),
        tabBarLabelStyle: {
          fontSize: width >= 1000 ? 14 : 11,
          fontWeight: "600",
        },
      }}
    >
      {visible.map((item) => (
        <Tabs.Screen
          key={item.id}
          name={item.id}
          options={{
            title: item.label,
            tabBarIcon: ({ color }) => <Icon name={item.icon} color={color} />,
          }}
        >
          {({ navigation }) => {
            const select = (id: string) =>
              root.navigate("Detail", { projectId: id });
            switch (item.id) {
              case "map":
                return (
                  <MapPage
                    onSelectProject={select}
                    onProjects={() => {
                      if (
                        role === "student" ||
                        role === "teacher" ||
                        role === "admin"
                      )
                        navigation.navigate("projects");
                      else navigation.navigate("gallery");
                    }}
                    onNewProject={() => root.navigate("Form")}
                  />
                );
              case "projects":
                return (
                  <ProjectsPage
                    onSelect={select}
                    onCreate={() => root.navigate("Form")}
                    onEdit={(id) => root.navigate("Form", { projectId: id })}
                  />
                );
              case "loans":
                return <LoansPage />;
              case "inventory":
                return <InventoryPage />;
              case "photos":
                return <DemoGalleryPage key={role} />;
              case "gallery":
                return (
                  <GalleryPage
                    onSelect={select}
                    onPresentation={() => root.navigate("Presentation")}
                  />
                );
              case "tv":
                return (
                  <PresentationPage
                    onBack={() => navigation.navigate("gallery")}
                  />
                );
            }
          }}
        </Tabs.Screen>
      ))}
    </Tabs.Navigator>
  );
}
