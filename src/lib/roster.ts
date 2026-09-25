import type { Localized } from "./types";

/**
 * SF6 전체 캐릭터 (Vs 가이드의 상대 선택용).
 * 사이트에 페이지가 있는 캐릭터(characters 표)와 달리, 아직 공략이 없는 캐릭터도 모두 담는다.
 * 이미지: 공식 사이트 이미지를 그대로 불러온다 (rosterImage / rosterBanner). 불러오지 못하면 이름 카드로 대신한다.
 *
 * 순서: 초기 로스터는 가나다순(E.혼다 = "이", JP = "제이피" 로 읽음), 시즌은 출시 순.
 */
export type RosterGroup = "base" | "s1" | "s2" | "s3" | "s4";

export const ROSTER_GROUPS: { id: RosterGroup; name: Localized }[] = [
  { id: "base", name: { ko: "초기 로스터", en: "Launch roster", ja: "初期ロスター" } },
  { id: "s1", name: { ko: "시즌 1", en: "Season 1", ja: "シーズン1" } },
  { id: "s2", name: { ko: "시즌 2", en: "Season 2", ja: "シーズン2" } },
  { id: "s3", name: { ko: "시즌 3", en: "Season 3", ja: "シーズン3" } },
  { id: "s4", name: { ko: "시즌 4", en: "Season 4", ja: "シーズン4" } },
];

export type RosterCharacter = {
  slug: string;
  group: RosterGroup;
  name: Localized;
  /** 공식 사이트 캐릭터 목록의 순번 (select_characterN) */
  officialNo: number;
  /** 공식 사이트 이미지 폴더 이름 */
  officialDir: string;
};

/** 우리 slug → [공식 목록 순번, 공식 이미지 폴더] */
const OFFICIAL: Record<string, [number, string]> = {
  ryu: [1, "ryu"],
  luke: [2, "luke"],
  jamie: [3, "jamie"],
  chunli: [4, "chunli"],
  guile: [5, "guile"],
  kimberly: [6, "kimberly"],
  juri: [7, "juri"],
  ken: [8, "ken"],
  blanka: [9, "blanka"],
  dhalsim: [10, "dhalsim"],
  ehonda: [11, "ehonda"],
  deejay: [12, "deejay"],
  manon: [13, "manon"],
  marisa: [14, "marisa"],
  jp: [15, "jp"],
  zangief: [16, "zangief"],
  lily: [17, "lily"],
  cammy: [18, "cammy"],
  rashid: [19, "rashid"],
  aki: [20, "aki"],
  ed: [21, "ed"],
  akuma: [22, "gouki_akuma"],
  mbison: [23, "vega_mbison"],
  terry: [24, "terry"],
  mai: [25, "mai"],
  elena: [26, "elena"],
  sagat: [27, "sagat"],
  cviper: [28, "cviper"],
  alex: [29, "alex"],
  ingrid: [30, "ingrid"],
  yasmine: [31, "yasmine"],
  arjun: [32, "arjun"],
};

const c = (slug: string, group: RosterGroup, ko: string, en: string, ja: string): RosterCharacter => ({
  slug,
  group,
  name: { ko, en, ja },
  officialNo: OFFICIAL[slug][0],
  officialDir: OFFICIAL[slug][1],
});

export const ROSTER: RosterCharacter[] = [
  // 초기 로스터 (가나다순)
  c("guile", "base", "가일", "Guile", "ガイル"),
  c("dhalsim", "base", "달심", "Dhalsim", "ダルシム"),
  c("deejay", "base", "디제이", "Dee Jay", "ディージェイ"),
  c("luke", "base", "루크", "Luke", "ルーク"),
  c("ryu", "base", "류", "Ryu", "リュウ"),
  c("lily", "base", "릴리", "Lily", "リリー"),
  c("manon", "base", "마농", "Manon", "マノン"),
  c("marisa", "base", "마리사", "Marisa", "マリーザ"),
  c("blanka", "base", "블랑카", "Blanka", "ブランカ"),
  c("ehonda", "base", "E.혼다", "E. Honda", "E.本田"),
  c("zangief", "base", "장기에프", "Zangief", "ザンギエフ"),
  c("jamie", "base", "제이미", "Jamie", "ジェイミー"),
  c("jp", "base", "JP", "JP", "JP"),
  c("juri", "base", "주리", "Juri", "ジュリ"),
  c("chunli", "base", "춘리", "Chun-Li", "春麗"),
  c("cammy", "base", "캐미", "Cammy", "キャミィ"),
  c("ken", "base", "켄", "Ken", "ケン"),
  c("kimberly", "base", "킴벌리", "Kimberly", "キンバリー"),
  // 시즌 1
  c("rashid", "s1", "라시드", "Rashid", "ラシード"),
  c("aki", "s1", "A.K.I.", "A.K.I.", "A.K.I."),
  c("ed", "s1", "에드", "Ed", "エド"),
  c("akuma", "s1", "고우키", "Akuma", "豪鬼"),
  // 시즌 2
  c("mbison", "s2", "베가", "M. Bison", "ベガ"),
  c("terry", "s2", "테리", "Terry", "テリー"),
  c("mai", "s2", "마이", "Mai", "舞"),
  c("elena", "s2", "엘레나", "Elena", "エレナ"),
  // 시즌 3
  c("sagat", "s3", "사가트", "Sagat", "サガット"),
  c("cviper", "s3", "C.바이퍼", "C. Viper", "C.ヴァイパー"),
  c("alex", "s3", "알렉스", "Alex", "アレックス"),
  c("ingrid", "s3", "잉그리드", "Ingrid", "イングリッド"),
  // 시즌 4
  c("yasmine", "s4", "야스민", "Yasmine", "ヤスミン"),
  c("arjun", "s4", "아르준", "Arjun", "アルジュン"),
];

export const rosterBySlug = (slug: string) => ROSTER.find((r) => r.slug === slug);

/**
 * 이미지는 공식 사이트의 것을 그대로 불러온다 (서버에서 내려받는 것은 막혀 있다).
 * 공식 사이트 구조가 바뀌면 깨질 수 있으니, 그때는 이 함수들만 고치면 된다.
 */
const OFFICIAL_BASE = "https://www.streetfighter.com/6/assets/images/character";

/** 캐릭터 선택용 컬러 이미지 (575×625, 이름이 새겨진 기울어진 카드) */
export function rosterImage(slug: string): string | null {
  const r = rosterBySlug(slug);
  return r ? `${OFFICIAL_BASE}/select_character${r.officialNo}_over.png` : null;
}

/**
 * 공식 캐릭터 페이지(넓은 화면)의 배치를 그대로 옮긴 값. 모두 페이지 폭 대비 % (공식 폴더 이름 기준).
 *   [캐릭터 이미지 왼쪽, 위, 폭]  — 높이는 이미지 비율대로
 * 배경은 폭 105%, 가운데·위쪽 맞춤. 공식 페이지는 맨 위 메뉴가 폭의 5.08% 만큼 덮고,
 * 그 아래 폭의 21.2% 높이가 첫 화면에 보인다 — 배너는 이 구간을 보여 준다.
 */
export const BANNER_LAYOUT = { menu: 5.08, height: 21.2, backgroundWidth: 105.04 } as const;

const FIGURE: Record<string, [number, number, number]> = {
  aki: [3.78, -15.7, 78.78],
  alex: [14.81, -11.5, 63.81],
  arjun: [19.54, 4.79, 56.72],
  blanka: [18.49, -3.9, 69.85],
  cammy: [19.01, 5.25, 57.77],
  chunli: [27.94, -5.72, 54.09],
  cviper: [18.49, -0.21, 62.23],
  deejay: [0.11, 2.1, 78.36],
  dhalsim: [17.96, 1.58, 73.53],
  ed: [13.76, 0.06, 60.66],
  ehonda: [15.86, -16.69, 78.78],
  elena: [-11.45, -36.71, 86.61],
  gouki_akuma: [18.49, -5.2, 68.01],
  guile: [21.64, 8.4, 51.47],
  ingrid: [12.19, -11.5, 70.9],
  jamie: [28.73, 2.1, 55.3],
  jp: [25.74, 3.15, 47.69],
  juri: [23.74, 0, 68.27],
  ken: [13.24, 0, 68.27],
  kimberly: [28.99, 0, 73.53],
  lily: [9.56, -11.69, 78.36],
  luke: [26.63, 3.68, 55.3],
  mai: [21.12, -10.45, 61.87],
  manon: [-0.78, 2.1, 97.37],
  marisa: [23.22, 2.1, 61.97],
  rashid: [10.09, -10.45, 100.83],
  ryu: [23.74, 5.25, 55.3],
  sagat: [11.66, -0.21, 70.9],
  terry: [11.92, -5.2, 61.87],
  vega_mbison: [23.74, -0.47, 56.3],
  yasmine: [14.29, -17.01, 74.44],
  zangief: [18.49, 3.68, 57.77],
};

/** 캐릭터 페이지 상단 배너: 배경 그림 + 캐릭터 이미지 (글자는 없음) */
export function rosterBanner(
  slug: string,
): { background: string; figure: string; left: number; top: number; width: number } | null {
  const r = rosterBySlug(slug);
  if (!r) return null;
  const dir = `${OFFICIAL_BASE}/${r.officialDir}`;
  const [left, top, width] = FIGURE[r.officialDir] ?? [20, 0, 60];
  return { background: `${dir}/bg_${r.officialDir}.jpg`, figure: `${dir}/${r.officialDir}.png`, left, top, width };
}
