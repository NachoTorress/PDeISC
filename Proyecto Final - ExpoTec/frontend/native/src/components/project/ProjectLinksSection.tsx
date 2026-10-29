/** Enlaces de un proyecto informático (repositorio de GitHub y página web), con la dirección visible. */
import { Text, View } from "react-native";
import { Button, Section } from "../ui";
import { useTheme } from "../../contexts/ThemeContext";

export function ProjectLinksSection({
  github,
  website,
  onOpen,
}: {
  /** Enlace seguro al repositorio, o "" si no hay. */
  github: string;
  /** Enlace seguro a la página, o "" si no hay. */
  website: string;
  onOpen: (url: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <Section title="Explorá el proyecto informático">
      {github && (
        <View style={{ gap: 8 }}>
          <Button
            title="Ver repositorio en GitHub"
            icon="github"
            variant="secondary"
            style={{ alignSelf: "flex-start" }}
            onPress={() => {
              onOpen(github);
            }}
          />
          <Text
            selectable
            style={{
              color: colors.muted,
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            {github}
          </Text>
        </View>
      )}
      {website && (
        <View style={{ gap: 8 }}>
          <Button
            title="Visitar la página del proyecto"
            icon="external"
            variant="secondary"
            style={{ alignSelf: "flex-start" }}
            onPress={() => {
              onOpen(website);
            }}
          />
          <Text
            selectable
            style={{
              color: colors.muted,
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            {website}
          </Text>
        </View>
      )}
    </Section>
  );
}
