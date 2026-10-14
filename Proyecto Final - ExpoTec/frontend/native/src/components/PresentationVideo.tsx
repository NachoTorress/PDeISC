import { useEffect } from "react";
import { VideoView, useVideoPlayer } from "expo-video";

/** El fin del video avanza la presentación; un fallo devuelve el proyecto a su ficha. */
export function PresentationVideo({
  uri,
  playing,
  onEnd,
  onError,
}: {
  uri: string;
  playing: boolean;
  onEnd: () => void;
  onError: () => void;
}) {
  const player = useVideoPlayer(uri);
  useEffect(() => {
    if (playing) player.play();
    else player.pause();
  }, [player, playing]);
  useEffect(() => {
    const ended = player.addListener("playToEnd", onEnd);
    const failed = player.addListener("statusChange", (status) => {
      if (status.status === "error") onError();
    });
    return () => {
      ended.remove();
      failed.remove();
    };
  }, [player, onEnd, onError]);
  return (
    <VideoView
      player={player}
      nativeControls
      contentFit="contain"
      style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 14 }}
    />
  );
}
