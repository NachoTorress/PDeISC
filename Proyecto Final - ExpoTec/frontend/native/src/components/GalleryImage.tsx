import { useState } from "react";
import { Image, Text, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

export default function GalleryImage({ uri, caption }: { uri: string; caption: string }) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  return (
    <View style={{ height: 220, borderRadius: 10, overflow: "hidden", backgroundColor: colors.surfaceVariant, justifyContent: "center" }}>
      {failed ? <Text style={{ color: colors.muted, textAlign: "center", padding: 16 }}>No pudimos cargar esta imagen. Su descripción sigue disponible.</Text> : (
        <Image source={{ uri }} accessibilityLabel={caption} resizeMode="contain" style={{ width: "100%", height: "100%" }} onError={() => setFailed(true)} />
      )}
    </View>
  );
}
