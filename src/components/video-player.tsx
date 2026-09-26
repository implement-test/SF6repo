"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { parseYouTube, youTubeEmbedUrl } from "@/lib/youtube";
import { YouTubeLoop } from "./youtube-loop";

/**
 * 추천 영상 한 편: 처음에는 썸네일만 보이고(가볍게), 누르면 그 자리에서 재생한다.
 * 구간 끝이 있고 반복이 켜져 있으면 구간 반복 플레이어로.
 */
export function VideoPlayer({
  url,
  start,
  end,
  loop,
  title,
  labels,
  playLabel,
}: {
  url: string;
  start: number | null;
  end: number | null;
  loop: boolean;
  title: string;
  labels: Dictionary["video"];
  playLabel: string;
}) {
  const [playing, setPlaying] = useState(false);
  const yt = parseYouTube(url);
  if (!yt) return null;
  const from = start ?? yt.start ?? 0;
  const to = end && end > from ? end : null;

  if (playing) {
    return to && loop ? (
      <YouTubeLoop id={yt.id} start={from} end={to} title={title} labels={labels} />
    ) : (
      <iframe
        src={`${youTubeEmbedUrl(yt.id, from || null, to)}&autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="aspect-video w-full border-0 bg-black"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`${playLabel}: ${title}`}
      className="group relative block aspect-video w-full overflow-hidden bg-black"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- YouTube 썸네일 */}
      <img
        src={`https://i.ytimg.com/vi/${yt.id}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
      />
      <span aria-hidden className="absolute inset-0 grid place-items-center">
        <span className="skew grid h-12 w-16 place-items-center bg-accent text-accent-fg shadow-lg transition group-hover:scale-110">
          <svg viewBox="0 0 16 16" className="size-6" fill="currentColor">
            <path d="M5 3.5v9l7.5-4.5z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
