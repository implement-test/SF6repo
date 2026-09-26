// 공식 캐릭터 이미지를 배너에 보이는 부분만 잘라 WebP 로 저장한다.
//
//   node scripts/crop-banners.mjs
//
// 입력 (git 에 올리지 않음): image-src/
//   {공식 폴더}/bg_{공식 폴더}.jpg   배너 배경
//   {공식 폴더}/{공식 폴더}.png      배너 캐릭터
//   select_characters/{slug}.png     목록 카드 (컬러)
// 출력:
//   public/characters/{slug}-bg.webp, {slug}-figure.webp, {slug}-select.webp
//   src/lib/banner-assets.ts  (자른 이미지의 배너 안 위치)
//
// 배치는 src/lib/roster.ts 의 공식 값(BANNER_LAYOUT, FIGURE)을 읽어 쓴다.
// 좌표는 모두 배너 무대 폭 대비 % (cqw). 무대 세로는 0 ~ BANNER_LAYOUT.height.

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "image-src");
const OUT = path.join(ROOT, "public", "characters");
const roster = fs.readFileSync(path.join(ROOT, "src/lib/roster.ts"), "utf8");

// roster.ts 에서 값 읽기
const num = (name) => Number(roster.match(new RegExp(`${name}: (-?[\\d.]+)`))[1]);
const MENU = num("menu");
const HEIGHT = num("height");
const BG_WIDTH = num("backgroundWidth");
const official = Object.fromEntries(
  [...roster.matchAll(/^ {2}(\w+): \[(\d+), "(\w+)"\],$/gm)].map((m) => [m[1], m[3]]),
);
const figureBlock = roster.slice(roster.indexOf("const FIGURE"));
const figure = Object.fromEntries(
  [...figureBlock.matchAll(/^ {2}(\w+): \[(-?[\d.]+), (-?[\d.]+), (-?[\d.]+), (-?[\d.]+)\],$/gm)].map((m) => [
    m[1],
    m.slice(2, 6).map(Number),
  ]),
);

fs.mkdirSync(OUT, { recursive: true });

/** 이미지 위에 놓인 상자(무대 좌표)와 창(0..100 × 0..HEIGHT)의 겹치는 부분만 자른다 */
async function cropToWindow(file, box, out, webp) {
  const meta = await sharp(file).metadata();
  const scale = meta.width / box.width; // 무대 1% 당 픽셀
  const boxHeight = meta.height / scale;
  const x0 = Math.max(box.left, 0);
  const x1 = Math.min(box.left + box.width, 100);
  const y0 = Math.max(box.top, 0);
  const y1 = Math.min(box.top + boxHeight, HEIGHT);
  if (x1 <= x0 || y1 <= y0) return null;
  const extract = {
    left: Math.max(0, Math.floor((x0 - box.left) * scale)),
    top: Math.max(0, Math.floor((y0 - box.top) * scale)),
  };
  extract.width = Math.min(meta.width - extract.left, Math.ceil((x1 - x0) * scale));
  extract.height = Math.min(meta.height - extract.top, Math.ceil((y1 - y0) * scale));
  await sharp(file).extract(extract).webp(webp).toFile(out);
  const r = (v) => Math.round(v * 100) / 100;
  return { left: r(x0), top: r(y0), width: r(x1 - x0), height: r(y1 - y0), px: `${extract.width}x${extract.height}` };
}

const kb = (f) => Math.round(fs.statSync(f).size / 1024);
const assets = {};
let before = 0;
let after = 0;

for (const [slug, dir] of Object.entries(official)) {
  const entry = {};
  const bgFile = path.join(SRC, dir, `bg_${dir}.jpg`);
  const figFile = path.join(SRC, dir, `${dir}.png`);
  const selFile = path.join(SRC, "select_characters", `${slug}.png`);

  if (fs.existsSync(bgFile)) {
    const out = path.join(OUT, `${slug}-bg.webp`);
    const box = { left: (100 - BG_WIDTH) / 2, top: -MENU, width: BG_WIDTH };
    entry.background = await cropToWindow(bgFile, box, out, { quality: 78 });
    before += kb(bgFile);
    after += kb(out);
  }
  if (fs.existsSync(figFile) && figure[dir]) {
    const out = path.join(OUT, `${slug}-figure.webp`);
    // 공식 페이지는 상자 안에 이미지를 비율대로 가운데 맞춤한다 (object-fit: contain)
    const [left, top, width, height] = figure[dir];
    const meta = await sharp(figFile).metadata();
    const ratio = meta.height / meta.width;
    const box =
      ratio < height / width
        ? { left, top: top - MENU + (height - width * ratio) / 2, width }
        : { left: left + (width - height / ratio) / 2, top: top - MENU, width: height / ratio };
    entry.figure = await cropToWindow(figFile, box, out, { quality: 80, alphaQuality: 90 });
    before += kb(figFile);
    after += kb(out);
  }
  if (fs.existsSync(selFile)) {
    // 목록 카드: 화면에서 최대 약 200px → 2배 해상도로 400px
    const out = path.join(OUT, `${slug}-select.webp`);
    await sharp(selFile).resize({ width: 400 }).webp({ quality: 80, alphaQuality: 90 }).toFile(out);
    entry.select = true;
    before += kb(selFile);
    after += kb(out);
  }
  if (Object.keys(entry).length) assets[slug] = entry;
  console.log(slug.padEnd(9), entry.background?.px ?? "-", entry.figure?.px ?? "-", entry.select ? "select" : "-");
}

const strip = (v) => v && `{ left: ${v.left}, top: ${v.top}, width: ${v.width}, height: ${v.height} }`;
const lines = Object.entries(assets).map(([slug, a]) => {
  const parts = [];
  if (a.background) parts.push(`background: ${strip(a.background)}`);
  if (a.figure) parts.push(`figure: ${strip(a.figure)}`);
  if (a.select) parts.push("select: true");
  return `  ${slug}: { ${parts.join(", ").replace(/"(\w+)":/g, "$1: ")} },`;
});
fs.writeFileSync(
  path.join(ROOT, "src/lib/banner-assets.ts"),
  `// scripts/crop-banners.mjs 가 만든 파일. 직접 고치지 말고 스크립트를 다시 실행한다.
// public/characters/ 에 있는 잘라 둔 이미지와 그 배너 안 위치 (무대 폭 대비 %).

export type CroppedBox = { left: number; top: number; width: number; height: number };
export type BannerAsset = { background?: CroppedBox; figure?: CroppedBox; select?: boolean };

export const BANNER_ASSETS: Record<string, BannerAsset> = {
${lines.join("\n")}
};
`,
);
console.log(`\n${Object.keys(assets).length}명, ${(before / 1024).toFixed(1)}MB → ${(after / 1024).toFixed(1)}MB`);
