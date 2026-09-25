import type { Localized } from "./types";

/**
 * SF6 전체 캐릭터 (Vs 가이드의 상대 선택용).
 * 사이트에 페이지가 있는 캐릭터(characters 표)와 달리, 아직 공략이 없는 캐릭터도 모두 담는다.
 * 이미지: public/characters/{slug}.png (공식 사이트 캐릭터 목록의 컬러 이미지). 없으면 이름 카드로 대신한다.
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

export type RosterCharacter = { slug: string; group: RosterGroup; name: Localized };

const c = (slug: string, group: RosterGroup, ko: string, en: string, ja: string): RosterCharacter => ({
  slug,
  group,
  name: { ko, en, ja },
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

export const rosterImage = (slug: string) => `/characters/${slug}.png`;
