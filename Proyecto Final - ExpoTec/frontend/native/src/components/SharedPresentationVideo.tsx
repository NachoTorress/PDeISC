/**
 * Video de la presentación TV en Android. Variante por plataforma: Metro elige `.native.tsx` en Android y `.web.tsx` en el navegador; `.d.ts` declara la interfaz común.
 */
import { useEffect } from "react";
import { VideoView, useVideoPlayer } from "expo-video";

export function SharedPresentationVideo({
  uri,
  playing,
  muted,
  onEnd,
  onError,
}: {
  uri: string;
  playing: boolean;
  muted: boolean;
  onEnd: () => void;
  onError: () => void;
  onBlocked: () => void;
}) {
  const player = useVideoPlayer(uri, (value) => {
    value.muted = muted;
  });
  useEffect(() => {
    const ended = player.addListener("playToEnd", () => {
      if (playing) onEnd();
    });
    const failed = player.addListener("statusChange", (value) => {
      if (value.status === "error") onError();
    });
    return () => {
      ended.remove();
      failed.remove();
    };
  }, [player, playing, onEnd, onError]);
  useEffect(() => {
    player.muted = muted;
    if (playing) player.play();
    else player.pause();
    return () => player.pause();
  }, [player, playing, muted]);
  return (
    <VideoView
      player={player}
      nativeControls={false}
      contentFit="contain"
      style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 14 }}
    />
  );
}
