// supabase/migrations/0001_init.sql 과 1:1 로 맞춘 타입

export type Localized = { ko: string; en?: string; ja?: string };

export type TargetLevel = "beginner" | "intermediate" | "advanced";
export type Difficulty = "easy" | "normal" | "hard";
/** 거리 무관 / 필드 / 코너 근처 / 코너 / 기타 */
export type ScreenPosition = "any" | "midscreen" | "near_corner" | "corner" | "other";
/** 노멀 / 퍼니시 카운터 / 구석 임팩트 가드 / 구석 임팩트 스턴 */
export type HitState = "normal" | "punish_counter" | "corner_impact_guard" | "corner_impact_stun";
export type MoveCategory = "normal" | "unique" | "special" | "super" | "throw" | "drive";

export const TARGET_LEVELS: TargetLevel[] = ["beginner", "intermediate", "advanced"];
export const HIT_STATES: HitState[] = ["normal", "punish_counter", "corner_impact_guard", "corner_impact_stun"];
export const POSITIONS: ScreenPosition[] = ["any", "midscreen", "near_corner", "corner", "other"];

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
    drive_cost: number;
    sa_cost: number;
    damage: number | null;
    /** 콤보 후 프레임 (예: "+32", "다운 +30") */
    frame_after: string | null;
    /** 콤보 후 위치 (셋업 화면용 정보) */
    end_position: ScreenPosition | null;
    difficulty: Difficulty;
    notes: Localized | null;
  };

// ───────────────────────── 셋업 ─────────────────────────

export type SetupSituation = { slug: string; name: Localized; sort_order: number };

/** 옵션 A / B / ... */
export type SetupOption = {
  label: string;
  classic: string;
  modern: string | null;
  description: Localized | null;
  youtube_url: string | null;
};

export type GuardSetting = "all" | "none" | "after_first" | "random";
export const GUARD_SETTINGS: GuardSetting[] = ["all", "none", "after_first", "random"];

/**
 * 트레이닝 모드 더미 설정. 리버설 슬롯은 콤보 표기로 적는다 (2LP, LPLK, 4 …).
 * 녹화 슬롯이 여러 개면 기본은 랜덤 재생.
 */
export type PracticeConfig = {
  guard: GuardSetting | null;
  playback: "random" | "sequential";
  wakeup: string[];
  after_guard: { count: number | null; slots: string[] };
  after_hit: string[];
  notes: Localized | null;
};

export type Setup = ContentBase &
  Media & {
    character_id: number;
    title: Localized;
    situations: string[];
    /** 셋업 입력 (옵션으로 갈라지기 전 공통 부분) */
    notation_classic: string | null;
    notation_modern: string | null;
    description: Localized | null;
    difficulty: Difficulty;
    options: SetupOption[];
    practice: PracticeConfig | null;
  };

export type SetupComboLink = { id: number; setup_id: number; combo_id: number; sort_order: number };
