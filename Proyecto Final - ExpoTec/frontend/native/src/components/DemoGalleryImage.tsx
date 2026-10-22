import { Image } from "react-native";
import robot from "../../assets/demo-gallery/robot.jpg";
import electronics from "../../assets/demo-gallery/electronics.jpg";

export default function DemoGalleryImage({
  uri,
  caption,
}: {
  uri: string;
  caption: string;
}) {
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
      resizeMode="cover"
      style={{ width: "100%", height: 220, borderRadius: 12 }}
    />
  );
}
