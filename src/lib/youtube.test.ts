import { describe, expect, it } from "vitest";
import { formatClock, parseClock, parseYouTube, youTubeEmbedUrl } from "./youtube";

describe("parseClock / formatClock", () => {
  it("초, 분:초, 시:분:초를 읽는다", () => {
    expect(parseClock("83")).toBe(83);
    expect(parseClock("1:23")).toBe(83);
    expect(parseClock(" 0:05 ")).toBe(5);
    expect(parseClock("1:02:03")).toBe(3723);
  });

  it("잘못된 값은 null", () => {
    expect(parseClock("")).toBeNull();
    expect(parseClock("1:75")).toBeNull();
    expect(parseClock("abc")).toBeNull();
  });

  it("초를 분:초로 보여 준다", () => {
    expect(formatClock(83)).toBe("1:23");
    expect(formatClock(5)).toBe("0:05");
    expect(formatClock(3723)).toBe("1:02:03");
  });

  it("구간 끝을 임베드 주소에 넣는다", () => {
    expect(youTubeEmbedUrl("dQw4w9WgXcQ", 10, 20)).toContain("end=20");
  });
});

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
    expect(youTubeEmbedUrl("dQw4w9WgXcQ", null)).toContain("vq=hd720");
  });
});
