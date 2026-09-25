import { describe, expect, it } from "vitest";
import { parseYouTube, youTubeEmbedUrl } from "./youtube";

describe("parseYouTube", () => {
  it("여러 형태의 링크에서 ID 를 뽑는다", () => {
    for (const url of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ",
      "https://youtube.com/shorts/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://www.youtube.com/live/dQw4w9WgXcQ?si=abc",
      "https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=x",
    ]) {
      expect(parseYouTube(url)?.id).toBe("dQw4w9WgXcQ");
    }
  });

  it("시작 시간을 초로 바꾼다", () => {
    expect(parseYouTube("https://youtu.be/dQw4w9WgXcQ?t=90")?.start).toBe(90);
    expect(parseYouTube("https://youtu.be/dQw4w9WgXcQ?t=90s")?.start).toBe(90);
    expect(parseYouTube("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s")?.start).toBe(90);
    expect(parseYouTube("https://youtu.be/dQw4w9WgXcQ")?.start).toBeNull();
  });

  it("YouTube 가 아니면 null", () => {
    expect(parseYouTube("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseYouTube("not a url")).toBeNull();
    expect(parseYouTube("")).toBeNull();
  });

  it("임베드 주소를 만든다", () => {
    expect(youTubeEmbedUrl("dQw4w9WgXcQ", 90)).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ?");
    expect(youTubeEmbedUrl("dQw4w9WgXcQ", 90)).toContain("start=90");
  });
});
