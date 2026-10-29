/**
 * Pila principal de pantallas. Las secciones "Shared*" usan la API real; las
 * pantallas "Home", "Detail", "Form" y "Presentation" pertenecen a la
 * demostración con datos locales.
 */
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../../contexts/ThemeContext";
import type { Role } from "../../lib/types";
import ProjectFormPage from "../../pages/ProjectFormPage";
import ProjectDetailPage from "../../pages/ProjectDetailPage";
import PresentationPage from "../../pages/PresentationPage";
import AccountPage from "../../pages/AccountPage";
import AdminUsersPage from "../../pages/AdminUsersPage";
import SharedGalleryPage from "../../pages/SharedGalleryPage";
import SharedSpacesPage from "../../pages/SharedSpacesPage";
import SharedProjectsPage from "../../pages/SharedProjectsPage";
import SharedProjectPage from "../../pages/SharedProjectPage";
import SharedProposalPage from "../../pages/SharedProposalPage";
import SharedInventoryPage from "../../pages/SharedInventoryPage";
import SharedLoansPage from "../../pages/SharedLoansPage";
import SharedPresentationPage from "../../pages/SharedPresentationPage";
import { HomeTabs } from "./HomeTabs";
import type { RootRoutes } from "./routes";

const Stack = createNativeStackNavigator<RootRoutes>();

export function RootStack({
  role,
  initialRouteName,
}: {
  /** Perfil de la demostración: el formulario local solo existe para estudiantes. */
  role: Role;
  initialRouteName: keyof RootRoutes;
}) {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
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
        options={{ title: "Espacios compartidos", headerShown: false }}
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
        options={{ title: "Proyectos compartidos", headerShown: false }}
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
        options={{ title: "Ingresar", headerShown: false }}
      >
        {({ navigation }) => (
          <AccountPage onSignedIn={() => navigation.replace("SharedSpaces")} />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="AdminUsers"
        options={{ title: "Usuarios y permisos", headerShown: false }}
      >
        {({ navigation }) => (
          <AdminUsersPage onAccount={() => navigation.popTo("Account")} />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="SharedGallery"
        options={{ title: "Galería de la ExpoTec", headerShown: false }}
      >
        {({ navigation }) => (
          <SharedGalleryPage onAccount={() => navigation.navigate("Account")} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Detail" options={{ title: "Proyecto" }}>
        {({ route, navigation }) => (
          <ProjectDetailPage
            projectId={route.params.projectId}
            onBack={() => navigation.goBack()}
            onEdit={(id) => navigation.navigate("Form", { projectId: id })}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="SharedInventory"
        options={{ title: "Inventario compartido", headerShown: false }}
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
        options={{ title: "Préstamos compartidos", headerShown: false }}
      >
        {({ navigation }) => (
          <SharedLoansPage onAccount={() => navigation.navigate("Account")} />
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
      <Stack.Screen name="Presentation" options={{ headerShown: false }}>
        {({ navigation }) => (
          <PresentationPage onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
