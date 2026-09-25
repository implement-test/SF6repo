// supabase/migrations/0001_init.sql 과 1:1 로 맞춘 타입

export type Localized = { ko: string; en?: string; ja?: string };

export type TargetLevel = "beginner" | "intermediate" | "advanced";
export type Difficulty = "easy" | "normal" | "hard";
export type ScreenPosition = "midscreen" | "corner" | "other";
export type HitState = "normal" | "counter" | "punish_counter" | "impact";
export type MoveCategory = "normal" | "unique" | "special" | "super" | "throw" | "drive";

export const TARGET_LEVELS: TargetLevel[] = ["beginner", "intermediate", "advanced"];
export const HIT_STATES: HitState[] = ["normal", "counter", "punish_counter", "impact"];
export const POSITIONS: ScreenPosition[] = ["midscreen", "corner", "other"];

type ContentBase = {
  id: number;
  target_level: TargetLevel;
  patch_id: number | null;
  sort_order: number;
  is_published: boolean;
  created_date: string; // YYYY-MM-DD
  /** 작성자 / 최근 수정자 (admins.user_id). 이름은 author_names 에서 찾는다 */
  created_by?: string | null;
  updated_by?: string | null;
  updated_at?: string;
};

type Media = {
  media_url: string | null;
  youtube_url: string | null;
  youtube_start: number | null;
};

export type Patch = { id: number; version: string; released_on: string };

export type Character = {
  id: number;
  slug: string;
  name: Localized;
  portrait_url: string | null;
  sort_order: number;
  is_published: boolean;
};

export type OverviewSection = ContentBase & {
  character_id: number;
  title: Localized;
  body: Localized;
};

export type Move = ContentBase &
  Media & {
    character_id: number;
    category: MoveCategory;
    name: Localized;
    input_classic: string;
    input_modern: string | null;
    damage: string | null;
    startup: string | null;
    active: string | null;
    recovery: string | null;
    on_hit: string | null;
    on_block: string | null;
    notes: Localized | null;
  };

/** 시동 기본기. 같은 루트에 여러 개를 붙일 수 있다. */
export type ComboStarter = { classic: string; modern: string | null };

export type Combo = ContentBase &
  Media & {
    character_id: number;
    title: Localized | null;
    /** 첫 번째가 데미지 기준 */
    starters: ComboStarter[];
    /** 루트 */
    notation_classic: string;
    notation_modern: string | null;
    hit_states: HitState[];
    position_start: ScreenPosition;
    position_end: ScreenPosition | null;
    drive_cost: number;
    sa_cost: number;
    damage: number | null;
    difficulty: Difficulty;
    notes: Localized | null;
  };
