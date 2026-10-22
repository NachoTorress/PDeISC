import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { managedPhoto } from "../lib/photoUpload";

export default function GalleryImage({
  uri,
  caption,
  height = 220,
}: {
  uri: string;
  caption: string;
  height?: number;
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
        height,
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
        <Image
          source={{ uri: source }}
          accessibilityLabel={caption}
          resizeMode="contain"
          style={{ width: "100%", height: "100%" }}
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}
