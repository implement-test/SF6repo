import type { Character, Combo, Patch } from "@/lib/types";

/**
 * Supabase 환경변수가 없을 때 쓰는 예시 데이터.
 * 화면 확인용일 뿐, 실제 공략 내용이 아니다.
 */

export const samplePatches: Patch[] = [{ id: 1, version: "sample", released_on: "2026-09-01" }];

export const sampleCharacters: Character[] = [
  {
    id: 1,
    slug: "terry",
    name: { ko: "테리", en: "Terry", ja: "テリー" },
    portrait_url: null,
    sort_order: 1,
    is_published: true,
  },
];

const base = {
  character_id: 1,
  patch_id: 1,
  is_published: true,
  media_url: null,
  youtube_url: null,
  youtube_start: null,
  notes: null,
} as const;

export const sampleCombos: Combo[] = [
  {
    ...base,
    id: 1,
    title: { ko: "[예시] 기본 콤보", en: "[Sample] Basic combo" },
    starters: [
      { classic: "2LP → 2LP", modern: "2L → 2L" },
      { classic: "5LP", modern: "5L" },
    ],
    notation_classic: "214LP",
    notation_modern: "214L",
    hit_states: ["normal"],
    position_start: "midscreen",
    position_end: "midscreen",
    drive_cost: 0,
    sa_cost: 0,
    damage: null,
    difficulty: "easy",
    target_level: "beginner",
    sort_order: 1,
    created_date: "2026-09-25",
  },
  {
    ...base,
    id: 2,
    title: { ko: "[예시] 드라이브 러시 캔슬" },
    starters: [],
    notation_classic: "2MP → DRC → 5HP → MP·HP → 236HP",
    notation_modern: null,
    hit_states: ["counter", "punish_counter"],
    position_start: "midscreen",
    position_end: "corner",
    drive_cost: 3,
    sa_cost: 0,
    damage: null,
    difficulty: "normal",
    target_level: "intermediate",
    sort_order: 2,
    created_date: "2026-09-25",
  },
  {
    ...base,
    id: 3,
    patch_id: 0,
    title: { ko: "[예시] 임팩트 후 코너", en: "[Sample] Corner after impact", ja: "[例] インパクト後 画面端" },
    starters: [{ classic: "DI", modern: "DI" }],
    notation_classic: "(벽꽝) → air HP → delay 5HP → 623KK → 236236P",
    notation_modern: "(벽꽝) → air H → delay 5H → 623SP → 236236H",
    hit_states: ["impact"],
    position_start: "corner",
    position_end: "corner",
    drive_cost: 1,
    sa_cost: 1,
    damage: null,
    difficulty: "hard",
    target_level: "advanced",
    sort_order: 3,
    created_date: "2026-09-20",
  },
];
