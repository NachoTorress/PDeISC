/** Elementos del inventario pedidos por un proyecto de la demostración, con sus cantidades. */
import { Text, View } from "react-native";
import { Section } from "../ui";
import { useTheme } from "../../contexts/ThemeContext";
import type { Project, Resource } from "../../lib/types";

export function DemoResourcesSection({
  project,
  resources,
}: {
  project: Project;
  /** Elementos con cantidad pedida mayor a cero. */
  resources: Resource[];
}) {
  const { colors } = useTheme();
  return (
    <Section title="Elementos solicitados">
      {resources.length ? (
        resources.map((resource) => (
          <View
            key={resource.id}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <Text style={{ color: colors.text, flex: 1 }}>{resource.name}</Text>
            <Text style={{ color: colors.text, fontWeight: "700" }}>
              {project.resources[resource.id]}
            </Text>
          </View>
        ))
      ) : (
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
          Este proyecto no solicitó elementos del inventario.
        </Text>
      )}
      <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
        Los préstamos se registran y se devuelven al final de cada día.
      </Text>
    </Section>
  );
}
