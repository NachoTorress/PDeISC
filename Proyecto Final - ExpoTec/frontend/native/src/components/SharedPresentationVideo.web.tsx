import { useEffect, useRef } from "react";

export function SharedPresentationVideo({
  uri,
  playing,
  muted,
  onEnd,
  onError,
  onBlocked,
}: {
  uri: string;
  playing: boolean;
  muted: boolean;
  onEnd: () => void;
  onError: () => void;
  onBlocked: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let current = true;
    video.muted = muted;
    if (playing) {
      void video.play().catch((error: unknown) => {
        if (!current) return;
        if (error instanceof DOMException && error.name === "NotAllowedError")
          onBlocked();
        else if (!(
          error instanceof DOMException && error.name === "AbortError"
        ))
          onError();
      });
    } else video.pause();
    return () => {
      current = false;
      video.pause();
    };
  }, [playing, muted, onError, onBlocked]);
  useEffect(() => {
    if (!playing) return;
    let lastTime = ref.current?.currentTime ?? 0,
      stalled = 0;
    const timer = setInterval(() => {
      const now = ref.current?.currentTime ?? 0;
      stalled = Math.abs(now - lastTime) < 0.05 ? stalled + 1 : 0;
      lastTime = now;
      if (stalled >= 30) {
        clearInterval(timer);
        onError();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [playing, onError]);
  return (
    <video
      ref={ref}
      src={uri}
      aria-label="Video del proyecto"
      muted={muted}
      playsInline
      preload="metadata"
      onEnded={() => {
        if (playing) onEnd();
      }}
      onError={onError}
      style={{
        width: "100%",
        maxHeight: "60vh",
        aspectRatio: "16 / 9",
        objectFit: "contain",
        borderRadius: 14,
        background: "#111",
      }}
    />
  );
}
