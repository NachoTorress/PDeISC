/**
 * Pestañas de la demostración, filtradas según el perfil ficticio elegido.
 * Se ubican a la izquierda en pantallas anchas y abajo en teléfonos.
 */
import { Pressable, useWindowDimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "../../contexts/ThemeContext";
import { useDemo } from "../../hooks/useDemo";
import { Icon } from "../Icon";
import MapPage from "../../pages/MapPage";
import ProjectsPage from "../../pages/ProjectsPage";
import LoansPage from "../../pages/LoansPage";
import InventoryPage from "../../pages/InventoryPage";
import GalleryPage from "../../pages/GalleryPage";
import PresentationPage from "../../pages/PresentationPage";
import DemoGalleryPage from "../../pages/DemoGalleryPage";
import { destinations, type RootRoutes, type TabRoutes } from "./routes";

const Tabs = createBottomTabNavigator<TabRoutes>();

/** Pestañas de la demostración: a la izquierda en pantallas anchas, abajo en teléfonos. */
export function HomeTabs() {
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
        tabBarActiveTintColor: colors.navigationAccent,
        tabBarActiveBackgroundColor: colors.navigationSelected,
        tabBarInactiveTintColor: colors.onNavigation,
        tabBarStyle: {
          backgroundColor: colors.navigation,
          borderColor: colors.navigationSelected,
          ...(width >= 1000
            ? { width: 184, minWidth: 184, paddingTop: 16 }
            : { minHeight: 60 }),
        },
        tabBarItemStyle: { minHeight: 52, height: 52, borderRadius: 10 },
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
