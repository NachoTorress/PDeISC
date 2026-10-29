/** Proyectos confirmados destacados al pie del plano de la demostración. */
import { Text } from "react-native";
import { ActionRow, Button, Card } from "../ui";
import ContentGrid from "../ContentGrid";
import ProjectArt from "../ProjectArt";
import { useTheme } from "../../contexts/ThemeContext";
import type { Project, Space } from "../../lib/types";

export function MapFeatured({
  projects,
  spaces,
  onSelectProject,
}: {
  projects: Project[];
  spaces: Space[];
  onSelectProject: (id: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: "600" }}>
        Lo que vas a encontrar
      </Text>
      <ContentGrid>
        {projects.slice(0, 3).map((project) => (
          <Card key={project.id} style={{ flex: 1 }}>
            <ProjectArt project={project} compact />
            <Text
              style={{ color: colors.text, fontWeight: "700", fontSize: 18 }}
            >
              {project.name}
            </Text>
            <Text style={{ color: colors.muted, lineHeight: 22 }}>
              {project.course} ·{" "}
              {spaces.find((item) => item.id === project.spaceId)?.name} ·{" "}
              {project.furnitureId}
            </Text>
            <ActionRow footer>
              <Button
                title="Ver proyecto"
                endIcon="external"
                variant="secondary"
                onPress={() => onSelectProject(project.id)}
              />
            </ActionRow>
          </Card>
        ))}
      </ContentGrid>
    </>
  );
}
