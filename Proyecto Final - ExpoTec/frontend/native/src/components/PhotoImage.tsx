/** Imagen con estado de carga y mensaje de error recuperable. */
import { useRef, useState } from "react";
import { Image } from "react-native";
import type { ImageProps } from "react-native";

export default function PhotoImage({
  source,
  caption,
  placeholderHeight = 220,
  fixedHeight,
  onError,
}: {
  source: ImageProps["source"];
  caption: string;
  placeholderHeight?: number;
  fixedHeight?: number;
  onError?: ImageProps["onError"];
}) {
  const [ratio, setRatio] = useState<number | null>(null);
  const image = useRef<Image>(null);
  return (
    <Image
      ref={image}
      source={source}
      accessibilityLabel={caption}
      resizeMode="contain"
      onError={onError}
      onLoad={(event) => {
        const native = event.nativeEvent.source;
        const web = (
          event.nativeEvent as unknown as {
            target?: { naturalWidth: number; naturalHeight: number };
          }
        ).target;
        // En web, el evento puede perder su target después de decodificar la foto.
        const rendered = (
          image.current as unknown as {
            querySelector?: (selector: string) => HTMLImageElement | null;
          }
        )?.querySelector?.("img");
        const width =
          native?.width ?? web?.naturalWidth ?? rendered?.naturalWidth ?? 0;
        const height =
          native?.height ?? web?.naturalHeight ?? rendered?.naturalHeight ?? 0;
        if (width > 0 && height > 0) setRatio(width / height);
        else if (rendered?.src)
          Image.getSize(
            rendered.src,
            (width, height) => {
              if (width > 0 && height > 0) setRatio(width / height);
            },
            () => {},
          );
      }}
      style={{
        width: "100%",
        ...(fixedHeight !== undefined
          ? { height: fixedHeight }
          : ratio
            ? {
                height: "auto",
                aspectRatio: ratio,
                maxWidth: placeholderHeight * ratio,
              }
            : { height: placeholderHeight }),
        alignSelf: "center",
        borderRadius: 12,
      }}
    />
  );
}
