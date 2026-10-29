/** Reproductor del video opcional de un proyecto. */
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { useIsFocused } from "@react-navigation/native";
import { useTheme } from "../contexts/ThemeContext";

/** Reproduce un enlace directo con controles nativos y muestra errores dentro de la ficha. */
export default function ProjectVideo({
  uri,
  showPresentationHint = true,
}: {
  uri: string;
  showPresentationHint?: boolean;
}) {
  const { colors } = useTheme();
  const [error, setError] = useState("");
  const player = useVideoPlayer(uri);
  const focused = useIsFocused();
  useEffect(() => {
    if (!focused) player.pause();
  }, [focused, player]);
  useEffect(() => {
    const subscription = player.addListener("statusChange", (event) => {
      if (event.status === "error")
        setError(
          "No pudimos reproducir el video. El equipo puede revisar el enlace desde Editar proyecto.",
        );
      else if (event.status === "readyToPlay") setError("");
    });
    return () => subscription.remove();
  }, [player]);
  return (
    <View style={{ gap: 8 }}>
      <VideoView
        player={player}
        nativeControls
        style={{ width: "100%", height: 240, borderRadius: 12 }}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={{ color: colors.error }}>
          {error}
        </Text>
      )}
      {showPresentationHint && (
        <Text style={{ color: colors.muted }}>
          Los videos de proyectos confirmados se incluyen en el modo TV.
        </Text>
      )}
    </View>
  );
}
