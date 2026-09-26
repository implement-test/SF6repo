"use client";

import { useEffect, useRef, useState } from "react";
import { formatClock } from "@/lib/youtube";

/**
 * 구간 반복 플레이어.
 * YouTube 의 loop 옵션은 구간이 아니라 영상 처음(0초)으로 돌아가므로,
 * IFrame Player API 로 재생 위치를 지켜보다가 구간 끝에 닿으면 구간 시작으로 되돌린다.
 * 방문자가 구간 밖으로 직접 옮기면 반복을 멈춰 영상 전체를 볼 수 있게 한다.
 */

type YTPlayer = {
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  destroy(): void;
};

type YTNamespace = {
  Player: new (
    el: HTMLElement,
    options: {
      host?: string;
      videoId: string;
      width?: string;
      height?: string;
      playerVars?: Record<string, string | number>;
      events?: { onStateChange?: (e: { data: number }) => void };
    },
  ) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

/** IFrame Player API 를 한 번만 불러온다 */
function loadApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve(window.YT!);
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    });
  }
  return apiPromise;
}

const ENDED = 0;

export function YouTubeLoop({
  id,
  start,
  end,
  title,
  labels,
}: {
  id: string;
  start: number;
  end: number;
  title: string;
  labels: { looping: string; paused: string; resume: string; stop: string };
}) {
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const [looping, setLooping] = useState(true);
  // 플레이어 콜백·타이머에서 최신 상태를 읽기 위한 사본
  const loopingRef = useRef(true);
  useEffect(() => {
    loopingRef.current = looping;
  }, [looping]);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    loadApi().then((YT) => {
      if (cancelled || !holder.current) return;
      const target = document.createElement("div");
      holder.current.appendChild(target);
      player.current = new YT.Player(target, {
        host: "https://www.youtube-nocookie.com",
        videoId: id,
        width: "100%",
        height: "100%",
        playerVars: { start, rel: 0, modestbranding: 1, playsinline: 1, vq: "hd1080" },
        events: {
          onStateChange: (e) => {
            if (e.data === ENDED && loopingRef.current) {
              player.current?.seekTo(start, true);
              player.current?.playVideo();
            }
          },
        },
      });

      // 재생 위치 감시
      timer = window.setInterval(() => {
        const p = player.current;
        if (!p?.getCurrentTime || !loopingRef.current) return;
        const t = p.getCurrentTime();
        // 구간 밖으로 크게 옮겼으면 방문자가 직접 옮긴 것 → 반복 멈춤
        if (t < start - 1.5 || t > end + 3) {
          setLooping(false);
          return;
        }
        if (t >= end) p.seekTo(start, true);
      }, 200);
    });

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      player.current?.destroy();
      player.current = null;
    };
  }, [id, start, end]);

  function resume() {
    setLooping(true);
    player.current?.seekTo(start, true);
    player.current?.playVideo();
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div ref={holder} title={title} className="aspect-video w-full border border-border bg-black [&>iframe]:size-full" />
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className={`font-semibold ${looping ? "text-accent" : "text-muted"}`}>
          {looping ? "⟳" : "‖"} {looping ? labels.looping : labels.paused} {formatClock(start)} – {formatClock(end)}
        </span>
        {looping ? (
          <button type="button" onClick={() => setLooping(false)} className="font-semibold text-muted underline hover:text-fg">
            {labels.stop}
          </button>
        ) : (
          <button type="button" onClick={resume} className="font-semibold text-accent underline">
            {labels.resume}
          </button>
        )}
      </div>
    </div>
  );
}
