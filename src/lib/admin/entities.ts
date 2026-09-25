/**
 * 관리자 편집 폼 정의. 필드 목록만 쓰면 편집 패널이 폼을 그린다.
 * 새 콘텐츠 종류(커맨드 리스트, 셋업 …)를 추가할 때는 여기에 항목을 추가한다.
 * 관리자 화면은 한국어만 쓴다.
 */

export type Option = { value: string; label: string };

export type Field = { key: string; label: string; help?: string; required?: boolean; wide?: boolean } & (
  | { type: "localized"; multiline?: boolean }
  | { type: "notation" }
  | { type: "starters" }
  /** 콤보 루트 여러 개 + 루트별 수치. 첫 번째는 칼럼, 나머지는 extra_routes 에 저장 */
  | { type: "routes" }
  | { type: "text" | "url" }
  | { type: "number"; step?: number; min?: number; max?: number; nullable?: boolean }
  | { type: "select"; options: Option[]; nullable?: boolean }
  | { type: "multiselect"; options: Option[] }
  | { type: "date" }
  | { type: "checkbox" }
  /** 영상 시각: "1:23" 또는 초로 입력, 초로 저장 */
  | { type: "clock" }
  | { type: "patch" }
  /** 셋업 상황 태그 (setup_situations 에서 불러온다) */
  | { type: "situations" }
  /** 셋업 옵션 A/B/... */
  | { type: "setupOptions" }
  /** 트레이닝 모드 더미 설정 */
  | { type: "practice" }
  /** 이 셋업으로 이어지는 콤보. 칼럼이 아니라 setup_combos 연결 표에 저장한다 */
  | { type: "comboLinks" }
);

export type FieldGroup = { title: string; fields: Field[] };

export type EntityType = "combo" | "patch" | "setup";

export type Entity = {
  table: string;
  label: string;
  groups: FieldGroup[];
  /** 새로 만들 때의 기본값 (호출하는 쪽에서 character_id 등을 덧붙인다) */
  defaults: () => Record<string, unknown>;
};

export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const LEVELS: Option[] = [
  { value: "beginner", label: "초급 (플래티넘 이하)" },
  { value: "intermediate", label: "중급 (다이아)" },
  { value: "advanced", label: "상급 (마스터 이상)" },
];

const DIFFICULTY: Option[] = [
  { value: "easy", label: "하" },
  { value: "normal", label: "중" },
  { value: "hard", label: "상" },
];

const POSITIONS: Option[] = [
  { value: "any", label: "거리 무관" },
  { value: "midscreen", label: "필드" },
  { value: "near_corner", label: "코너 근처" },
  { value: "corner", label: "코너" },
  { value: "other", label: "기타" },
];


const HIT_STATES: Option[] = [
  { value: "normal", label: "노멀" },
  { value: "punish_counter", label: "퍼니시 카운터" },
  { value: "corner_impact_guard", label: "구석 임팩트 가드" },
  { value: "corner_impact_stun", label: "구석 임팩트 스턴" },
];

/** 콘텐츠 공통 필드 */
const META_GROUP: FieldGroup = {
  title: "관리",
  fields: [
    { key: "target_level", label: "대상", type: "select", options: LEVELS },
    { key: "patch_id", label: "기준 패치", type: "patch" },
    { key: "created_date", label: "작성일", type: "date" },
    { key: "is_published", label: "공개", type: "checkbox" },
  ],
};

const MEDIA_GROUP: FieldGroup = {
  title: "영상",
  fields: [
    { key: "media_url", label: "짧은 영상 URL (R2)", type: "url", wide: true },
    { key: "youtube_url", label: "YouTube URL", type: "url", wide: true, help: "링크에 t= 가 있으면 그 시점부터 재생합니다." },
    {
      key: "youtube_start",
      label: "구간 시작",
      type: "clock",
      help: "예: 1:23 또는 83(초). 입력하면 링크의 t= 보다 우선합니다.",
    },
    { key: "youtube_end", label: "구간 끝", type: "clock", help: "비우면 영상 끝까지 재생합니다." },
    {
      key: "youtube_loop",
      label: "구간 반복",
      type: "checkbox",
      help: "구간 시작~끝을 계속 반복합니다 (구간 끝이 있어야 합니다).",
    },
  ],
};

const metaDefaults = () => ({
  target_level: "beginner",
  created_date: today(),
  is_published: true,
});

export const ENTITIES: Record<EntityType, Entity> = {
  combo: {
    table: "combos",
    label: "콤보",
    groups: [
      {
        title: "콤보",
        fields: [
          { key: "title", label: "제목", type: "localized" },
          {
            key: "starters",
            label: "시동 기본기",
            type: "starters",
            wide: true,
            help: "같은 루트로 이어지는 시동기를 그룹으로 묶습니다. 프리셋을 불러오면 프리셋 이름의 그룹이 됩니다. 데미지 기준 시동기를 고르세요 (고르지 않으면 첫 번째).",
          },
          {
            key: "routes",
            label: "루트",
            type: "routes",
            wide: true,
            help: "같은 시동기로 이어지는 루트를 여러 개 넣을 수 있습니다. 카드에는 루트 1의 수치가 보이고, 다른 루트에 마우스를 올리면 그 루트의 수치로 바뀝니다. 데미지는 시동기 칸에서 고른 데미지 기준 시동기로 잰 값. 모던을 비워 두면 '클래식 전용'.",
          },
        ],
      },
      {
        title: "태그",
        fields: [
          { key: "hit_states", label: "히트 상태", type: "multiselect", options: HIT_STATES, wide: true },
          { key: "position_start", label: "시작 위치", type: "select", options: POSITIONS },
        ],
      },
      { title: "기타", fields: [{ key: "difficulty", label: "입력 난이도", type: "select", options: DIFFICULTY }] },
      {
        title: "설명",
        fields: [
          {
            key: "notes",
            label: "메모 (공용)",
            type: "localized",
            multiline: true,
            help: "모든 루트에 공통인 메모. 루트가 여러 개면 루트 칸에서 루트별 메모도 쓸 수 있습니다.",
          },
        ],
      },
      MEDIA_GROUP,
      META_GROUP,
    ],
    defaults: () => ({
      ...metaDefaults(),
      starters: [],
      hit_states: ["normal"],
      position_start: "midscreen",
      routes: [{ classic: "", modern: null, damage: null, drive_cost: 0, sa_cost: 0, frame_after: null, note: null }],
      difficulty: "normal",
    }),
  },

  setup: {
    table: "setups",
    label: "셋업",
    groups: [
      {
        title: "셋업",
        fields: [
          { key: "title", label: "제목", type: "localized", required: true },
          { key: "situations", label: "상황", type: "situations", wide: true },
          {
            key: "combo_links",
            label: "이 셋업으로 이어지는 콤보",
            type: "comboLinks",
            wide: true,
            help: "콤보의 루트(마무리 루트), 콤보 후 위치, 콤보 후 프레임이 셋업에 표시됩니다. 잡기 후 셋업처럼 콤보가 없어도 됩니다.",
          },
          { key: "notation_classic", label: "셋업 초반 공통 루트 (클래식)", type: "notation", wide: true, help: "옵션으로 갈라지기 전 공통 부분 (없으면 비움)" },
          { key: "notation_modern", label: "셋업 초반 공통 루트 (모던)", type: "notation", wide: true },
          { key: "description", label: "설명", type: "localized", multiline: true },
        ],
      },
      { title: "셋업을 위한 프랙티스 설정", fields: [{ key: "practice", label: "트레이닝 모드 더미 설정", type: "practice", wide: true }] },
      { title: "옵션", fields: [{ key: "options", label: "옵션 1 / 2 / …", type: "setupOptions", wide: true }] },
      { title: "기타", fields: [{ key: "difficulty", label: "입력 난이도", type: "select", options: DIFFICULTY }] },
      MEDIA_GROUP,
      META_GROUP,
    ],
    defaults: () => ({
      ...metaDefaults(),
      situations: [],
      options: [1, 2].map((n) => ({
        label: `옵션 ${n}`,
        classic: "",
        modern: null,
        description: null,
        branches: [
          { result: "hit", classic: "", modern: null, note: null },
          { result: "guard", classic: "", modern: null, note: null },
        ],
        youtube_url: null,
      })),
      practice: null,
      difficulty: "normal",
      combo_links: [],
    }),
  },

  patch: {
    table: "patches",
    label: "패치",
    groups: [
      {
        title: "패치",
        fields: [
          { key: "version", label: "버전", type: "text", required: true, help: "예: 2026.09 (화면에는 'Ver. 2026.09')" },
          { key: "released_on", label: "적용일", type: "date" },
          { key: "note", label: "메모", type: "localized", multiline: true },
        ],
      },
    ],
    defaults: () => ({ released_on: today() }),
  },
};
