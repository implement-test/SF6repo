/**
 * 관리자 편집 폼 정의. 필드 목록만 쓰면 편집 패널이 폼을 그린다.
 * 새 콘텐츠 종류(커맨드 리스트, 셋업 …)를 추가할 때는 여기에 항목을 추가한다.
 * 관리자 화면은 한국어만 쓴다.
 */

export type Option = { value: string; label: string };

export type Field = { key: string; label: string; help?: string; required?: boolean; wide?: boolean } & (
  | { type: "localized"; multiline?: boolean }
  | { type: "notation" }
  | { type: "text" | "url" }
  | { type: "number"; step?: number; min?: number; max?: number; nullable?: boolean }
  | { type: "select"; options: Option[]; nullable?: boolean }
  | { type: "multiselect"; options: Option[] }
  | { type: "date" }
  | { type: "checkbox" }
  | { type: "patch" }
);

export type FieldGroup = { title: string; fields: Field[] };

export type EntityType = "combo" | "patch";

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
  { value: "midscreen", label: "필드" },
  { value: "corner", label: "코너" },
  { value: "other", label: "기타" },
];

const HIT_STATES: Option[] = [
  { value: "normal", label: "노멀" },
  { value: "counter", label: "카운터" },
  { value: "punish_counter", label: "퍼니시 카운터" },
  { value: "impact", label: "임팩트" },
];

/** 콘텐츠 공통 필드 */
const META_GROUP: FieldGroup = {
  title: "관리",
  fields: [
    { key: "target_level", label: "대상", type: "select", options: LEVELS },
    { key: "patch_id", label: "기준 패치", type: "patch" },
    { key: "created_date", label: "작성일", type: "date" },
    { key: "sort_order", label: "정렬 순서", type: "number", step: 1, help: "작을수록 위" },
    { key: "is_published", label: "공개", type: "checkbox" },
  ],
};

const MEDIA_GROUP: FieldGroup = {
  title: "영상",
  fields: [
    { key: "media_url", label: "짧은 영상 URL (R2)", type: "url", wide: true },
    { key: "youtube_url", label: "YouTube URL", type: "url", wide: true },
    { key: "youtube_start", label: "YouTube 시작 (초)", type: "number", step: 1, min: 0, nullable: true },
  ],
};

const metaDefaults = () => ({
  target_level: "beginner",
  created_date: today(),
  sort_order: 0,
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
          { key: "notation_classic", label: "클래식 표기", type: "notation", required: true, wide: true },
          {
            key: "notation_modern",
            label: "모던 표기",
            type: "notation",
            wide: true,
            help: "비워 두면 '클래식 전용'으로 표시됩니다.",
          },
        ],
      },
      {
        title: "태그",
        fields: [
          { key: "hit_states", label: "히트 상태", type: "multiselect", options: HIT_STATES, wide: true },
          { key: "position_start", label: "시작 위치", type: "select", options: POSITIONS },
          { key: "position_end", label: "종료 위치", type: "select", options: POSITIONS, nullable: true },
        ],
      },
      {
        title: "수치",
        fields: [
          { key: "damage", label: "데미지", type: "number", step: 1, min: 0, nullable: true },
          { key: "drive_cost", label: "드라이브 소모 (칸)", type: "number", step: 0.5, min: 0, max: 6 },
          { key: "sa_cost", label: "SA 소모 (칸)", type: "number", step: 1, min: 0, max: 3 },
          { key: "difficulty", label: "입력 난이도", type: "select", options: DIFFICULTY },
        ],
      },
      { title: "설명", fields: [{ key: "notes", label: "메모", type: "localized", multiline: true }] },
      MEDIA_GROUP,
      META_GROUP,
    ],
    defaults: () => ({
      ...metaDefaults(),
      hit_states: ["normal"],
      position_start: "midscreen",
      position_end: null,
      drive_cost: 0,
      sa_cost: 0,
      damage: null,
      difficulty: "normal",
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
