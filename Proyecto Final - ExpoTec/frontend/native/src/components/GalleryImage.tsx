/** Imagen de la galería compartida; si es privada, pide la vista previa autorizada a la API. */
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { managedPhoto } from "../lib/photoUpload";
import PhotoImage from "./PhotoImage";

/** Muestra la imagen o su vista previa privada (`POST /api/uploads/preview`). */
export default function GalleryImage({
  uri,
  caption,
  height = 220,
  bounded = false,
}: {
  uri: string;
  caption: string;
  height?: number;
  bounded?: boolean;
}) {
  const { colors } = useTheme();
  const { client, user } = useAuth();
  const [failed, setFailed] = useState(false);
  const [resolved, setResolved] = useState({ key: "", uri: "" });
  const privateImage = !!user && managedPhoto(uri),
    key = `${user?.id}:${uri}`;
  useEffect(() => {
    setFailed(false);
    if (!privateImage) return;
    let active = true;
    void client
      .send<{ image: string }>("/api/uploads/preview", { imageUrl: uri })
      .then((result) => {
        if (active) setResolved({ key, uri: result.image });
      })
      .catch(() => {
        if (active) setResolved({ key, uri });
      });
    return () => {
      active = false;
    };
  }, [client, privateImage, key, uri]);
  const source = privateImage
    ? resolved.key === key
      ? resolved.uri
      : ""
    : uri;
  return (
    <View
      style={{
        height: bounded ? height : undefined,
        minHeight: !source || failed ? height : undefined,
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: colors.surfaceVariant,
        justifyContent: "center",
      }}
    >
      {!source ? (
        <ActivityIndicator color={colors.primary} />
      ) : failed ? (
        <Text style={{ color: colors.muted, textAlign: "center", padding: 16 }}>
          No pudimos cargar esta imagen. Su descripción sigue disponible.
        </Text>
      ) : (
        <PhotoImage
          key={source}
          source={{ uri: source }}
          caption={caption}
          placeholderHeight={height}
          fixedHeight={bounded ? height : undefined}
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}
