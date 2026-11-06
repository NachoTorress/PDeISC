/** Diapositiva de la muestra: imagen o video y texto legible a distancia. */
import { useState } from "react";
import { Image, Text, View, useWindowDimensions } from "react-native";
import type { ReactNode } from "react";
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
  const { width, height } = useWindowDimensions();
  const wide = width > height;
  const compact = height < 600 || width < 600;
  const titleSize = wide ? Math.min(60, Math.max(28, height * 0.055)) : 28;
  const bodySize = compact ? 16 : 22;
  const [failedImage, setFailedImage] = useState("");
  const imageKey = `${project.id}:${project.imageUrl}`;
  const names = (people: PresentationProject["members"]) =>
    people.map((p) => `${p.firstName} ${p.lastName}`).join(" · ");
  return (
    <View
      testID="presentation-slide"
      style={{
        flex: 1,
        minHeight: 0,
        flexDirection: wide ? "row" : "column",
        gap: compact ? 16 : 40,
      }}
    >
      <View
        style={{
          flex: wide ? 1.35 : 0.8,
          minWidth: 0,
          minHeight: 0,
          justifyContent: "center",
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: "#141c2b",
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
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                padding: 24,
              }}
            >
              <Icon name="projects" size={compact ? 64 : 110} color="#b3c4ff" />
              <Text
                style={{
                  color: "#bcc7dd",
                  fontSize: bodySize,
                  textAlign: "center",
                }}
              >
                {project.course}
              </Text>
            </View>
          ))}
      </View>
      <View
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          justifyContent: "center",
          gap: height < 700 ? 8 : compact ? 10 : 20,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            color: "#b3c4ff",
            fontSize: compact ? 14 : 18,
            fontWeight: "600",
          }}
        >
          {project.course}
        </Text>
        <Text
          accessibilityRole="header"
          numberOfLines={height < 850 || compact ? 2 : 3}
          style={{
            color: "#f5f7ff",
            fontSize: titleSize,
            lineHeight: titleSize * 1.12,
            fontWeight: "700",
            letterSpacing: -0.8,
          }}
        >
          {project.name}
        </Text>
        <Text
          numberOfLines={height < 700 ? 2 : compact || height < 850 ? 3 : 5}
          style={{
            color: "#ccd5e8",
            fontSize: bodySize,
            lineHeight: bodySize * 1.45,
          }}
        >
          {project.description}
        </Text>
        {!!project.members.length && (
          <Text
            numberOfLines={height < 700 ? 1 : compact || height < 850 ? 2 : 3}
            style={{
              color: "#f5f7ff",
              fontSize: bodySize,
              lineHeight: bodySize * 1.4,
            }}
          >
            Equipo: {names(project.members)}
          </Text>
        )}
        {!compact && height >= 850 && !!project.teachers.length && (
          <Text
            numberOfLines={2}
            style={{ color: "#aebbd3", fontSize: 17, lineHeight: 24 }}
          >
            Profesores: {names(project.teachers)}
          </Text>
        )}
        {!compact && height >= 850 && !!project.subjects.length && (
          <Text
            numberOfLines={2}
            style={{ color: "#aebbd3", fontSize: 17, lineHeight: 24 }}
          >
            {project.subjects.join(" · ")}
          </Text>
        )}
        <View
          style={{
            borderLeftWidth: 3,
            borderLeftColor: "#b3c4ff",
            paddingLeft: 14,
            marginTop: compact ? 0 : 8,
          }}
        >
          <Text
            numberOfLines={2}
            style={{
              color: "#f0bd97",
              fontSize: compact ? 17 : 24,
              lineHeight: compact ? 23 : 31,
              fontWeight: "600",
            }}
          >
            {project.spaceName} · Puesto {project.furnitureId}
          </Text>
        </View>
        {videoFailed && (
          <Text style={{ color: "#aebbd3", fontSize: 13 }}>
            Video no disponible. La muestra continúa con la imagen y los datos.
          </Text>
        )}
      </View>
    </View>
  );
}
