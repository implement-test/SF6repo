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

/** 개인정보 보호 모드(youtube-nocookie) 임베드 주소 */
export function youTubeEmbedUrl(id: string, start: number | null): string {
  const params = new URLSearchParams({ rel: "0", modestbranding: "1" });
  if (start) params.set("start", String(start));
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}
