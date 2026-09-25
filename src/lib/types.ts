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

export type Combo = ContentBase &
  Media & {
    character_id: number;
    title: Localized | null;
    notation_classic: string;
    notation_modern: string | null;
    starter_move_id: number | null;
    hit_states: HitState[];
    position_start: ScreenPosition;
    position_end: ScreenPosition | null;
    drive_cost: number;
    sa_cost: number;
    damage: number | null;
    difficulty: Difficulty;
    notes: Localized | null;
  };
