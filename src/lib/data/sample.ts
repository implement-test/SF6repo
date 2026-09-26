import type { Character, CharacterOverview, Move, VsAction, Combo, Patch, Setup, SetupComboLink, SetupSituation, VsGuide } from "@/lib/types";
import { ROSTER } from "@/lib/roster";

/**
 * Supabase 환경변수가 없을 때 쓰는 예시 데이터.
 * 화면 확인용일 뿐, 실제 공략 내용이 아니다.
 */

export const samplePatches: Patch[] = [{ id: 1, version: "sample", released_on: "2026-09-01" }];

// 로스터 32명 전원 (테리는 예시 콤보·셋업이 붙은 id 1)
export const sampleCharacters: Character[] = ROSTER.map((r, i) => ({
  id: r.slug === "terry" ? 1 : i + 2,
  slug: r.slug,
  name: r.name,
  portrait_url: null,
  sort_order: i + 1,
  is_published: true,
}));

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
      {
        name: "약 시동",
        starters: [
          { classic: "2LP → 2LP", modern: "2L → 2L" },
          { classic: "5LP", modern: "5L" },
        ],
      },
      { name: "카운터 시동", starters: [{ classic: "counter 5MP", modern: "counter 5M" }] },
    ],
    notation_classic: "214LP",
    notation_modern: "214L",
    hit_states: ["normal"],
    position_start: "midscreen",
    frame_after: "+32",
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
    extra_routes: [
      { classic: "2MP → DRC → 5HP → 236236K", modern: null, damage: 3800, drive_cost: 3, sa_cost: 2, frame_after: "다운 +14", note: { ko: "SA2 로 마무리. 게이지가 있을 때만." } },
    ],
    hit_states: ["punish_counter"],
    position_start: "midscreen",
    frame_after: "다운 +30",
    drive_cost: 3,
    sa_cost: 0,
    damage: 2400,
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
    starters: [{ name: null, starters: [{ classic: "DI", modern: "DI" }] }],
    notation_classic: "(벽꽝) → air HP → delay 5HP → 623KK → 236236P",
    notation_modern: "(벽꽝) → air H → delay 5H → 623SP → 236236H",
    hit_states: ["corner_impact_stun"],
    position_start: "corner",
    frame_after: "다운 +30",
    drive_cost: 1,
    sa_cost: 1,
    damage: null,
    difficulty: "hard",
    target_level: "advanced",
    sort_order: 3,
    created_date: "2026-09-20",
  },
];

export const sampleSituations: SetupSituation[] = [
  { slug: "any", name: { ko: "거리 무관", en: "Any range", ja: "距離不問" }, sort_order: 1 },
  { slug: "midscreen", name: { ko: "필드", en: "Midscreen", ja: "画面中央" }, sort_order: 2 },
  { slug: "corner", name: { ko: "코너", en: "Corner", ja: "画面端" }, sort_order: 3 },
];

const setupBase = {
  character_id: 1,
  patch_id: 1,
  is_published: true,
  media_url: null,
  youtube_url: null,
  youtube_start: null,
  difficulty: "normal",
  created_date: "2026-09-25",
} as const;

export const sampleSetups: Setup[] = [
  {
    ...setupBase,
    id: 1,
    title: { ko: "[예시] 코너 기상 압박", en: "[Sample] Corner oki" },
    situations: ["corner"],
    notation_classic: "66 → delay 5MP",
    notation_modern: null,
    description: { ko: "예시 설명입니다. 실제 공략 내용이 아닙니다." },
    target_level: "intermediate",
    sort_order: 1,
    options: [
      {
        label: "옵션 1",
        classic: "(약간 끌어서) 5HP",
        modern: null,
        description: { ko: "HP가 2히트 되는 거리에서 써야 됨" },
        branches: [
          { result: "hit", classic: "5HP(2) → 236HK", modern: null, note: { ko: "(이건 어려우니 패스)" } },
          { result: "hit", classic: "5HP(2) → 2MP", modern: null, note: { ko: "HP 가 1타만 맞아도 2MP 이어짐" } },
          { result: "guard", classic: "2LK → 5LP → 623HP", modern: null, note: { ko: "2LK 후 2LP 는 안 들어감" } },
          { result: "guard", classic: "(살짝 걸어) f.throw", modern: null, note: { ko: "4F 비벼도 잡힘" } },
        ],
        youtube_url: null,
      },
      {
        label: "입문자용",
        classic: "2LK",
        modern: null,
        description: { ko: "너무 깊게 넣으려고 하면 4F에 끊기므로 2LK 끝 부분 닿도록" },
        branches: [
          { result: "hit", classic: "2MP", modern: null, note: null },
          { result: "guard", classic: "2MP → 623MP", modern: null, note: { ko: "2LK 후 2LP 는 안 들어감" } },
        ],
        youtube_url: null,
      },
    ],
    practice: {
      guard_setting: "all",
      guard_switch: "random",
      drive_reversal: { off: 3, guard: 5, wakeup: 2 },
      wakeup: [
        { command: { ko: "4F 기본기" }, delay: 0 },
        { command: { ko: "뒤로 걷기 (녹화)" }, delay: 0 },
        { command: { ko: "하단 막기 (녹화)" }, delay: 0 },
      ],
      guard: [
        { command: { ko: "4F 기본기" }, count: 0, delay: 0 },
        { command: { ko: "뒤로 걷기 (녹화)" }, count: 0, delay: 0 },
        { command: { ko: "하단 막기 (녹화)" }, count: 0, delay: 0 },
        { command: { ko: "기본 잡기" }, count: 0, delay: 0 },
      ],
      after_hit: [],
      notes: { ko: "예시 데이터입니다." },
    },
  },
  {
    ...setupBase,
    id: 2,
    title: { ko: "[예시] 잡기 후 상황" },
    situations: ["any"],
    notation_classic: "f.throw → 66",
    notation_modern: null,
    description: null,
    target_level: "beginner",
    sort_order: 2,
    options: [{ label: "옵션 1", classic: "5LP", modern: null, description: null, branches: [], youtube_url: null }],
    practice: null,
  },
];

export const sampleSetupLinks: SetupComboLink[] = [
  { id: 1, setup_id: 1, combo_id: 2, sort_order: 0 },
  { id: 2, setup_id: 1, combo_id: 3, sort_order: 1 },
];
const vsBase = {
  character_id: 1,
  patch_id: 1,
  is_published: true,
  media_url: null,
  youtube_url: null,
  youtube_start: null,
  actions: [] as VsAction[],
  target_level: "beginner",
  created_date: "2026-09-26",
} as const;

export const sampleVsGuides: VsGuide[] = [
  {
    ...vsBase,
    id: 1,
    opponent: "ryu",
    topic: "cheese",
    title: { ko: "[예시] 거리 싸움 기본" },
    body: { ko: "장풍은 점프로 넘기보다 중거리에서 드라이브 임팩트로 받아친다.\n근거리에서는 무리하지 말고 잡기 심리." },
    sort_order: 1,
  },
  {
    ...vsBase,
    id: 2,
    opponent: "ryu",
    topic: "block_punish",
    title: { ko: "[예시] 승룡권 가드 후" },
    body: { ko: "거리와 게이지에 따라 고른다. 공용 설명 예시." },
    actions: [
      { classic: "5HP → 236HP", modern: null, note: { ko: "가까울 때 기본 확정. 데미지 우선." } },
      { classic: "2MK → DRC → 5HP", modern: null, note: { ko: "드라이브 게이지가 있을 때. 코너 운반." } },
      { classic: "214214P", modern: "SP", note: { ko: "SA 게이지가 있으면 최대 데미지." } },
    ],
    target_level: "intermediate",
    sort_order: 2,
  },
  {
    ...vsBase,
    id: 3,
    opponent: "ken",
    topic: "pressure_gap",
    title: { ko: "[예시] 용권선풍각 후 틈" },
    body: { ko: "가드 후 약간 멀어지므로 2MK 로 끼어든다." },
    sort_order: 3,
  },
];

export const sampleOverviews: CharacterOverview[] = [
  {
    id: 1,
    character_id: 1,
    summary: {
      ko: "[예시] 돌진기와 대공이 모두 갖춰진 올라운더.\n중거리에서 기본기로 견제하다가 드라이브 러시로 파고드는 운영이 기본이다.",
    },
    pros: [{ ko: "[예시] 믿을 만한 무적 대공" }, { ko: "[예시] 코너 운반력이 좋은 콤보" }],
    cons: [{ ko: "[예시] 돌진기는 가드되면 반격 확정" }, { ko: "[예시] 장거리 견제 수단이 적음" }],
    modern_notes: [{ ko: "[예시] 어시스트 콤보로 기본 콤보가 쉬워짐" }, { ko: "[예시] 일부 커맨드 기본기는 모던에 없음" }],
    patch_id: 1,
    is_published: true,
    created_date: "2026-09-26",
  },
];

const moveBase = {
  character_id: 1,
  patch_id: 1,
  is_published: true,
  media_url: null,
  youtube_url: null,
  youtube_start: null,
  target_level: "beginner",
  created_date: "2026-09-26",
  notes: null,
  input_modern: null,
} as const;

export const sampleMoves: Move[] = [
  { ...moveBase, id: 1, sort_order: 1, category: "normal", name: { ko: "[예시] 서서 약펀치" }, input_classic: "5LP", input_modern: "5L", damage: "300", startup: "4", active: "3", recovery: "7", on_hit: "+4", on_block: "-1" },
  { ...moveBase, id: 2, sort_order: 2, category: "normal", name: { ko: "[예시] 앉아 중킥" }, input_classic: "2MK", input_modern: "2M", damage: "500", startup: "8", active: "3", recovery: "17", on_hit: "-2", on_block: "-6", notes: { ko: "캔슬 가능한 하단 견제기" } },
  { ...moveBase, id: 3, sort_order: 3, category: "special", name: { ko: "[예시] 돌진기" }, input_classic: "236HP", input_modern: "SP", damage: "1000", startup: "14", active: "8", recovery: "22", on_hit: "다운", on_block: "-12" },
  { ...moveBase, id: 4, sort_order: 4, category: "super", name: { ko: "[예시] SA1" }, input_classic: "236236P", damage: "2000", startup: "9", active: "4", recovery: "40", on_hit: "다운", on_block: "-25" },
];
