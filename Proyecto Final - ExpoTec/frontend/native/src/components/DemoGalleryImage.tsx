import { Image } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import robot from "../../assets/demo-gallery/robot.jpg";
import electronics from "../../assets/demo-gallery/electronics.jpg";

export default function DemoGalleryImage({
  uri,
  caption,
}: {
  uri: string;
  caption: string;
}) {
  const { colors } = useTheme();
  const source =
    uri === "sample:robot"
      ? robot
      : uri === "sample:electronics"
        ? electronics
        : { uri };
  return (
    <Image
      source={source}
      accessibilityLabel={caption}
      resizeMode="contain"
      style={{
        width: "100%",
        height: 220,
        borderRadius: 12,
        backgroundColor: colors.surfaceVariant,
      }}
    />
  );
}
