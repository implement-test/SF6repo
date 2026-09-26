// scripts/crop-banners.mjs 가 만든 파일. 직접 고치지 말고 스크립트를 다시 실행한다.
// public/characters/ 에 있는 잘라 둔 이미지와 그 배너 안 위치 (무대 폭 대비 %).

export type CroppedBox = { left: number; top: number; width: number; height: number };
export type BannerAsset = { background?: CroppedBox; figure?: CroppedBox; select?: boolean };

export const BANNER_ASSETS: Record<string, BannerAsset> = {
  ryu: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 23.75, top: 0.17, width: 55.27, height: 21.03 }, select: true },
  luke: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 26.63, top: 0, width: 55.29, height: 21.2 }, select: true },
  jamie: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 28.75, top: 0, width: 55.26, height: 21.2 }, select: true },
  chunli: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 27.94, top: 0, width: 54.09, height: 21.2 }, select: true },
  guile: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 21.64, top: 3.32, width: 51.47, height: 17.88 }, select: true },
  kimberly: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 29.02, top: 0, width: 70.98, height: 21.2 }, select: true },
  juri: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 23.76, top: 0, width: 68.23, height: 21.2 }, select: true },
  ken: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 13.25, top: 0, width: 68.24, height: 21.2 }, select: true },
  blanka: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 18.49, top: 0, width: 69.85, height: 21.2 }, select: true },
  dhalsim: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 17.97, top: 0, width: 73.5, height: 21.2 }, select: true },
  ehonda: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 15.87, top: 0, width: 78.76, height: 21.2 }, select: true },
  deejay: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 0.11, top: 0, width: 78.36, height: 21.2 }, select: true },
  manon: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 0, top: 0, width: 96.59, height: 21.2 }, select: true },
  marisa: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 23.22, top: 0, width: 61.97, height: 21.2 }, select: true },
  jp: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 25.74, top: 0, width: 47.68, height: 21.2 }, select: true },
  zangief: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 18.49, top: 0, width: 57.76, height: 21.2 }, select: true },
  lily: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 9.56, top: 0, width: 78.36, height: 21.2 }, select: true },
  cammy: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 19.01, top: 0.17, width: 57.77, height: 21.03 }, select: true },
  rashid: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 16.47, top: 0, width: 83.53, height: 21.2 }, select: true },
  aki: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 3.78, top: 0, width: 78.78, height: 21.2 }, select: true },
  ed: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 13.76, top: 0, width: 60.66, height: 21.2 }, select: true },
  akuma: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 18.49, top: 0, width: 68.01, height: 21.2 }, select: true },
  mbison: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 23.76, top: 0, width: 56.27, height: 21.2 }, select: true },
  terry: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 11.92, top: 0, width: 61.87, height: 21.2 }, select: true },
  mai: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 21.12, top: 0, width: 61.87, height: 21.2 }, select: true },
  elena: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 0, top: 0, width: 75.16, height: 21.2 }, select: true },
  sagat: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 11.66, top: 0, width: 70.9, height: 21.2 }, select: true },
  cviper: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 24.04, top: 0, width: 51.14, height: 21.2 }, select: true },
  alex: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 14.81, top: 0, width: 63.81, height: 21.2 }, select: true },
  ingrid: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 12.19, top: 0, width: 70.9, height: 21.2 }, select: true },
  yasmine: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 14.29, top: 0, width: 74.44, height: 21.2 }, select: true },
  arjun: { background: { left: 0, top: 0, width: 100, height: 21.2 }, figure: { left: 21.27, top: 0, width: 53.27, height: 21.2 }, select: true },
};
