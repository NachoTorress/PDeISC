import PhotoImage from "./PhotoImage";
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
    <PhotoImage
      key={uri}
      source={source}
      caption={caption}
      placeholderHeight={280}
    />
  );
}
