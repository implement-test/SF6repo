/**
 * YouTube 링크에서 영상 ID 와 시작 시간을 뽑는다.
 * 지원: watch?v= / youtu.be / shorts / embed / live, 시작 시간 t=90, t=1m30s, start=90
 */
export function parseYouTube(url: string | null | undefined): { id: string; start: number | null } | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }

  const host = u.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = u.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") id = u.searchParams.get("v");
    else {
      const m = /^\/(?:shorts|embed|live|v)\/([^/?#]+)/.exec(u.pathname);
      id = m?.[1] ?? null;
    }
  }
  if (!id || !/^[\w-]{6,20}$/.test(id)) return null;

  return { id, start: parseTime(u.searchParams.get("t") ?? u.searchParams.get("start")) };
}

function parseTime(value: string | null): number | null {
  if (!value) return null;
  if (/^\d+s?$/.test(value)) return parseInt(value, 10);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
  if (!m || !value) return null;
  const [, h, min, s] = m;
  return Number(h ?? 0) * 3600 + Number(min ?? 0) * 60 + Number(s ?? 0);
}

/**
 * 개인정보 보호 모드(youtube-nocookie) 임베드 주소.
 * vq=hd1080 은 1080p 를 요청하지만 YouTube 가 무시할 수 있다. 실제 화질은 플레이어 크기(와 화면 배율)로
 * 정해지므로 플레이어를 카드 폭 전체로 크게 둔다 (src/components/media.tsx).
 */
export function youTubeEmbedUrl(id: string, start: number | null, end: number | null = null): string {
  const params = new URLSearchParams({ rel: "0", modestbranding: "1", vq: "hd1080" });
  if (start) params.set("start", String(start));
  if (end) params.set("end", String(end));
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

/** "83", "1:23", "1:02:03" → 초. 해석할 수 없으면 null */
export function parseClock(text: string): number | null {
  const s = text.trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) return Number(s);
  const m = /^(?:(\d+):)?(\d{1,2}):(\d{1,2})$/.exec(s);
  if (!m) return null;
  const [, h, min, sec] = m;
  if (Number(sec) >= 60 || (h !== undefined && Number(min) >= 60)) return null;
  return Number(h ?? 0) * 3600 + Number(min) * 60 + Number(sec);
}

/** 초 → "1:23" (1시간 넘으면 "1:02:03") */
export function formatClock(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * X(구 트위터) 게시물 링크에서 게시물 ID 를 뽑는다. 영상만 따로 넣는 공식 방법이 없어 게시물 카드 전체를 임베드한다.
 * 지원: x.com / twitter.com / mobile.twitter.com 의 /{계정}/status/{id} (뒤에 /video/1, ?s=20 등이 붙어도 된다)
 */
export function parseXPost(url: string | null | undefined): { id: string } | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www\.|mobile\.)/, "");
  if (host !== "x.com" && host !== "twitter.com") return null;
  const m = /^\/(?:[\w]+\/status|i\/web\/status)\/(\d{1,25})(?:\/|$)/.exec(u.pathname);
  return m ? { id: m[1] } : null;
}

/** 영상 칸에 넣을 수 있는 링크인지 (YouTube 또는 X 게시물) */
export function isVideoLink(url: string | null | undefined): boolean {
  return !!parseYouTube(url) || !!parseXPost(url);
}
