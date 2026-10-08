"use client";

import { useEffect, useRef, useState } from "react";

type Twttr = {
  widgets: {
    createTweet: (id: string, el: HTMLElement, options: Record<string, unknown>) => Promise<HTMLElement | undefined>;
  };
};

const SCRIPT = "https://platform.twitter.com/widgets.js";
let loading: Promise<Twttr> | null = null;

/** X 의 임베드 스크립트를 한 번만 불러온다 */
function loadWidgets(): Promise<Twttr> {
  const w = window as unknown as { twttr?: Twttr };
  if (w.twttr?.widgets) return Promise.resolve(w.twttr);
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => (w.twttr?.widgets ? resolve(w.twttr) : reject(new Error("twttr missing")));
    script.onerror = () => {
      loading = null;
      reject(new Error("widgets.js failed"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/**
 * X(구 트위터) 게시물 임베드. X 는 영상만 따로 넣는 방법이 없어서 게시물 카드(작성자 · 본문 · 영상)를 그대로 보여 준다.
 * 영상 펼치기를 눌렀을 때만 그려지므로 X 스크립트도 그때 불러온다. 답글 스레드는 숨기고, 추적(dnt)은 끈다.
 * 게시물이 지워졌거나 불러오지 못하면 X 로 가는 링크를 보여 준다.
 */
export function XPostEmbed({ id, url, labels }: { id: string; url: string; labels: { loading: string; open: string } }) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "done" | "failed">("loading");

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let cancelled = false;
    const theme = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    loadWidgets()
      .then((twttr) => twttr.widgets.createTweet(id, el, { theme, dnt: true, conversation: "none", align: "center" }))
      .then((tweet) => !cancelled && setState(tweet ? "done" : "failed"))
      .catch(() => !cancelled && setState("failed"));
    return () => {
      cancelled = true;
      el.replaceChildren();
    };
  }, [id]);

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div ref={box} className="w-full max-w-[550px]" />
      {state === "loading" && <p className="text-sm text-muted">{labels.loading}</p>}
      {state === "failed" && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-accent hover:underline">
          {labels.open} ↗
        </a>
      )}
    </div>
  );
}
