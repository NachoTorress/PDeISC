import { useState } from "react";
import { Image, Text, View, useWindowDimensions } from "react-native";
import type { ReactNode } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { Chip, Heading } from "./ui";
import { Icon } from "./Icon";
import type { PresentationProject } from "../lib/sharedPresentation";

export function SharedPresentationCard({
  project,
  video,
  videoFailed,
}: {
  project: PresentationProject;
  video?: ReactNode;
  videoFailed: boolean;
}) {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const wide = width > 900;
  const [failedImage, setFailedImage] = useState("");
  const imageKey = `${project.id}:${project.imageUrl}`;
  const names = (people: PresentationProject["members"]) =>
    people
      .map((person) => `${person.firstName} ${person.lastName}`)
      .join(" · ");
  const paragraph = {
    color: colors.text,
    fontSize: wide ? 19 : 16,
    lineHeight: wide ? 28 : 24,
  };
  return (
    <View
      style={{
        flexDirection: wide ? "row" : "column",
        gap: 28,
        flexGrow: 1,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          flex: wide ? 1.4 : undefined,
          minWidth: 0,
          justifyContent: "center",
          gap: 10,
        }}
      >
        {video ??
          (project.imageUrl && failedImage !== imageKey ? (
            <Image
              key={imageKey}
              accessibilityLabel={`Imagen del proyecto ${project.name}`}
              source={{ uri: project.imageUrl }}
              resizeMode="contain"
              onError={() => setFailedImage(imageKey)}
              style={{
                width: "100%",
                height: wide ? Math.max(200, Math.min(520, height - 330)) : 230,
                borderRadius: 14,
              }}
            />
          ) : (
            <View
              style={{
                minHeight: wide ? 260 : 180,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.surfaceVariant,
                borderRadius: 14,
                padding: 20,
                gap: 16,
              }}
            >
              <Icon name="gallery" size={52} color={colors.muted} />
              <Text style={{ color: colors.muted, lineHeight: 22 }}>
                Imagen no disponible · la presentación continúa con la ficha.
              </Text>
            </View>
          ))}
        {videoFailed && (
          <Text style={{ color: colors.muted, lineHeight: 22 }}>
            Video no disponible · presentación con ficha. Podés volver a
            intentar el video.
          </Text>
        )}
      </View>
      <View
        style={{
          flex: wide ? 1 : undefined,
          minWidth: 0,
          justifyContent: "center",
          gap: 16,
        }}
      >
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Chip label={project.course} />
          <Chip label="Confirmado" tone="success" />
        </View>
        <Text
          accessibilityRole="header"
          numberOfLines={wide ? 3 : undefined}
          style={{
            color: colors.text,
            fontSize: wide ? 38 : 28,
            lineHeight: wide ? 44 : 34,
            fontWeight: "700",
          }}
        >
          {project.name}
        </Text>
        <Text
          numberOfLines={wide ? 5 : undefined}
          style={{
            color: colors.muted,
            fontSize: wide ? 20 : 16,
            lineHeight: wide ? 29 : 24,
          }}
        >
          {project.description}
        </Text>
        <Text numberOfLines={wide ? 3 : undefined} style={paragraph}>
          Equipo: {names(project.members)}
        </Text>
        <Text numberOfLines={wide ? 2 : undefined} style={paragraph}>
          Profesores: {names(project.teachers)}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {project.subjects.map((subject) => (
            <Chip key={subject} label={subject} />
          ))}
        </View>
        <Heading
          title={`${project.spaceName} · Puesto ${project.furnitureId}`}
        />
      </View>
    </View>
  );
}
