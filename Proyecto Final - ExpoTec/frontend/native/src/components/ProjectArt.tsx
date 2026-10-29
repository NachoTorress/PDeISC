/** Imagen del proyecto o ilustración de reemplazo cuando no tiene imagen. */
import { View } from "react-native";
import type { Project } from "../lib/types";
import { Icon } from "./Icon";
import { useTheme } from "../contexts/ThemeContext";
import PhotoImage from "./PhotoImage";
export default function ProjectArt({
  project,
  compact = false,
  height,
  bounded = false,
}: {
  project: Project;
  compact?: boolean;
  height?: number;
  bounded?: boolean;
}) {
  const { colors } = useTheme();
  const tone =
    project.category === "plant"
      ? { fill: colors.selectedContainer, ink: colors.onSelectedContainer }
      : project.category === "energy"
        ? { fill: colors.accentContainer, ink: colors.accent }
        : { fill: colors.infoContainer, ink: colors.info };
  if (project.image)
    return (
      <PhotoImage
        key={project.image}
        caption={`Imagen de ${project.name}`}
        source={{ uri: project.image }}
        placeholderHeight={height ?? (compact ? 108 : 172)}
        fixedHeight={bounded ? height : undefined}
      />
    );
  return (
    <View
      style={{
        height: Math.min(height ?? (compact ? 96 : 120), 210),
        borderRadius: 12,
        backgroundColor: tone.fill,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={project.category} size={compact ? 36 : 44} color={tone.ink} />
    </View>
  );
}
