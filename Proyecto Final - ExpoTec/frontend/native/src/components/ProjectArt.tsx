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
        backgroundColor: colors.surfaceVariant,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon
        name={project.category}
        size={compact ? 36 : 44}
        color={colors.muted}
      />
    </View>
  );
}
