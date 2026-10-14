import { Image, View } from "react-native";
import type { Project } from "../lib/types";
import { Icon } from "./Icon";
import { useTheme } from "../contexts/ThemeContext";
export default function ProjectArt({
  project,
  compact = false,
  height,
}: {
  project: Project;
  compact?: boolean;
  height?: number;
}) {
  const { colors } = useTheme();
  if (project.image)
    return (
      <Image
        accessibilityLabel={`Imagen de ${project.name}`}
        source={{ uri: project.image }}
        resizeMode="cover"
        style={{
          width: "100%",
          height: height ?? (compact ? 108 : 172),
          borderRadius: 12,
        }}
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
