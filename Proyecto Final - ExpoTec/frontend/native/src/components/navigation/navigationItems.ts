/**
 * Arma las opciones del menú principal según los permisos de la cuenta:
 * inventario y préstamos para préstamos o administración, usuarios solo para
 * administración. El resto de las secciones es para todos.
 */
import type { NavigationItem } from "../AppNavigation";
import type { AccountUser } from "../../lib/authTypes";
import type { SectionRoute } from "./routes";

/**
 * @param user Cuenta con sesión iniciada, o null para visitantes.
 * @param openSection Acción que abre una sección del menú.
 * @returns Opciones visibles del menú, en orden.
 */
export function navigationItems(
  user: AccountUser | null,
  openSection: (route: SectionRoute) => void,
): NavigationItem[] {
  return [
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
      id: "Home",
      label: "Demostración",
      icon: "play",
      onPress: () => openSection("Home"),
    },
  ];
}
