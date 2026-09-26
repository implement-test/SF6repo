import type { Button } from "./parse";

/**
 * 아이콘 파일은 모두 public/icons 에 있다.
 * 원본 아이콘을 교체할 때는 이 파일의 경로만 바꾸면 된다.
 */

export type IconRef = {
  src: string;
  /** 파일 없이 기존 아이콘을 뒤집어 쓰는 방향(3, 7, 8)용 */
  flip?: "x" | "y";
  /** 가로로 긴 아이콘(DI, DR, DRC, AUTO)은 폭이 다르다 */
  wide?: boolean;
  /** 원본 아이콘에 글자가 없는 경우(모던 L/M/H) 위에 겹쳐 쓸 글자 */
  overlay?: string;
  alt: string;
};

const DIRECTION_ICONS: Record<string, IconRef> = {
  "1": { src: "/icons/dir-1.webp", alt: "1" },
  "2": { src: "/icons/dir-2.webp", alt: "2" },
  "3": { src: "/icons/dir-9.webp", flip: "y", alt: "3" },
  "4": { src: "/icons/dir-4.webp", alt: "4" },
  "6": { src: "/icons/dir-6.webp", alt: "6" },
  "7": { src: "/icons/dir-9.webp", flip: "x", alt: "7" },
  "8": { src: "/icons/dir-2.webp", flip: "y", alt: "8" },
  "9": { src: "/icons/dir-9.webp", alt: "9" },
  // 앞대쉬 / 뒷대쉬: 새로 그린 아이콘. 44 는 66 을 좌우 반전
  "66": { src: "/icons/dir-66.svg", alt: "66" },
  "44": { src: "/icons/dir-66.svg", flip: "x", alt: "44" },
  "236": { src: "/icons/dir-236.webp", alt: "236" },
  "214": { src: "/icons/dir-214.webp", alt: "214" },
  "623": { src: "/icons/dir-623.webp", alt: "623" },
};

const MOTIONS_BY_LENGTH = Object.keys(DIRECTION_ICONS).sort((a, b) => b.length - a.length);

/**
 * 방향 입력을 아이콘 목록으로 바꾼다.
 * 전용 아이콘이 없는 입력(236236, 22, 41236 …)은 앞에서부터 가장 긴 모션으로 나눈다.
 */
export function directionIcons(direction: string): IconRef[] {
  const out: IconRef[] = [];
  let rest = direction;
  while (rest.length > 0) {
    const motion = MOTIONS_BY_LENGTH.find((m) => rest.startsWith(m));
    if (!motion) {
      // 5 같은 아이콘 없는 숫자는 건너뛴다.
      rest = rest.slice(1);
      continue;
    }
    out.push(DIRECTION_ICONS[motion]);
    rest = rest.slice(motion.length);
  }
  return out;
}

export const BUTTON_ICONS: Record<Button, IconRef> = {
  LP: { src: "/icons/btn-lp.webp", alt: "LP" },
  MP: { src: "/icons/btn-mp.webp", alt: "MP" },
  HP: { src: "/icons/btn-hp.webp", alt: "HP" },
  LK: { src: "/icons/btn-lk.webp", alt: "LK" },
  MK: { src: "/icons/btn-mk.webp", alt: "MK" },
  HK: { src: "/icons/btn-hk.webp", alt: "HK" },
  P: { src: "/icons/btn-p.png", alt: "P" },
  K: { src: "/icons/btn-k.png", alt: "K" },
  L: { src: "/icons/modern-l.webp", overlay: "L", alt: "L" },
  M: { src: "/icons/modern-m.webp", overlay: "M", alt: "M" },
  H: { src: "/icons/modern-h.webp", overlay: "H", alt: "H" },
  SP: { src: "/icons/modern-sp.webp", alt: "SP" },
  A: { src: "/icons/modern-auto.png", wide: true, alt: "AUTO" },
  ANY: { src: "/icons/modern-any.png", alt: "ANY" },
};

export const SYSTEM_ICONS: Record<"DR" | "DRC" | "DI" | "PARRY", IconRef> = {
  DR: { src: "/icons/dr.svg", wide: true, alt: "DR" },
  DRC: { src: "/icons/drc.svg", wide: true, alt: "DRC" },
  DI: { src: "/icons/di.png", wide: true, alt: "DI" },
  PARRY: { src: "/icons/parry.svg", wide: true, alt: "PARRY" },
};
