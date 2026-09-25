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

/** 옵션의 결과별 분기: 히트 / 가드 / 헛침 */
export type OptionResult = "hit" | "guard" | "whiff";
export const OPTION_RESULTS: OptionResult[] = ["hit", "guard", "whiff"];

export type OptionBranch = {
  result: OptionResult;
  /** 이어지는 루트 (콤보 표기) */
  classic: string;
  modern: string | null;
  note: Localized | null;
};

/** 옵션 1 / 2 / ... */
export type SetupOption = {
  label: string;
  /** 옵션의 행동 (콤보 표기. 글자는 괄호로: "(약간 끌어서) 5HP") */
  classic: string;
  modern: string | null;
  description: Localized | null;
  branches: OptionBranch[];
  youtube_url: string | null;
};

/**
 * 셋업을 연습하기 위한 트레이닝 모드 더미 설정.
 * 더미는 아무 캐릭터로 하므로 커맨드는 표기가 아니라 글자로 적는다 ("4F 기본기", "뒤로 걷기 (녹화)").
 * delay 는 프레임.
 */
export type PracticeRow = { command: Localized; count?: number | null; delay: number | null };

export type PracticeConfig = {
  /** 다운 리버설 */
  wakeup: PracticeRow[];
  /** 가드 리버설 (count = 몇 번 가드한 뒤) */
  guard: PracticeRow[];
  /** 데미지 복귀 리버설 */
  after_hit: PracticeRow[];
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
