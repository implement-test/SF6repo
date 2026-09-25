-- SF6 Repository 초기 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣어 실행한다.
--
-- 공통 규칙
--   * 다국어 텍스트는 jsonb {"ko": "...", "en": "...", "ja": "..."} — ko 필수
--   * 콘텐츠 테이블 공통 컬럼: target_level, patch_id(기준 패치), created_date(작성일), sort_order, is_published
--   * 읽기: 누구나 공개된 행만 / 쓰기: admins 테이블에 등록된 계정만 (RLS)

-- ───────────────────────── 기본 타입 / 함수 ─────────────────────────

create type target_level as enum ('beginner', 'intermediate', 'advanced');   -- 초급(플레 이하) / 중급(다이아) / 상급(마스터+)
create type difficulty   as enum ('easy', 'normal', 'hard');                  -- 입력 난이도 하 / 중 / 상
create type screen_position as enum ('midscreen', 'corner', 'other');          -- 필드 / 코너 / 기타
create type move_category as enum ('normal', 'unique', 'special', 'super', 'throw', 'drive');
create type item_type as enum ('overview', 'move', 'combo', 'setup', 'practice', 'vs_punish', 'vs_pattern', 'glossary');

-- 다국어 필드 검증: 한국어는 비어 있으면 안 된다.
create function has_ko(v jsonb) returns boolean
language sql immutable as $$
  select v ? 'ko' and length(trim(v->>'ko')) > 0
$$;

-- 관리자 목록. 대시보드 Authentication 에서 계정을 만든 뒤 여기에 user_id 를 넣는다.
create table admins (
  user_id uuid primary key references auth.users on delete cascade
);
alter table admins enable row level security;

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid())
$$;

-- ───────────────────────── 기준 데이터 ─────────────────────────

create table patches (
  id          serial primary key,
  version     text not null unique,          -- 예: "Ver.2026.09"
  released_on date not null,
  note        jsonb
);

create table characters (
  id           serial primary key,
  slug         text not null unique,          -- URL 용: terry
  name         jsonb not null check (has_ko(name)),
  portrait_url text,
  sort_order   int not null default 0,
  is_published boolean not null default false,
  created_date date not null default current_date
);

-- 셋업 상황 태그 (기상 공격, 안전 점프, 잡기 후, 콤보 후 …) — 관리자가 자유롭게 추가
create table setup_situations (
  slug       text primary key,
  name       jsonb not null check (has_ko(name)),
  sort_order int not null default 0
);

-- ───────────────────────── 콘텐츠 ─────────────────────────

-- 캐릭터 개요: 장점 / 단점 / 특징 등 섹션 단위
create table overview_sections (
  id           serial primary key,
  character_id int not null references characters on delete cascade,
  title        jsonb not null check (has_ko(title)),
  body         jsonb not null check (has_ko(body)),   -- 마크다운
  target_level target_level not null default 'beginner',
  patch_id     int references patches,
  sort_order   int not null default 0,
  is_published boolean not null default true,
  created_date date not null default current_date,
  updated_at   timestamptz not null default now()
);

-- 커맨드 리스트 + 프레임 데이터 (프레임 값은 "3-5", "+4(+8)", "KD" 처럼 텍스트)
create table moves (
  id            serial primary key,
  character_id  int not null references characters on delete cascade,
  category      move_category not null,
  name          jsonb not null check (has_ko(name)),
  input_classic text not null,               -- 콤보 표기법과 동일한 문법
  input_modern  text,                        -- 없으면 클래식 전용
  damage        text,
  startup       text,
  active        text,
  recovery      text,
  on_hit        text,
  on_block      text,
  notes         jsonb,
  media_url     text,                        -- R2 의 mp4/webm
  youtube_url   text,
  youtube_start int,                         -- 초 단위 타임스탬프
  target_level  target_level not null default 'beginner',
  patch_id      int references patches,
  sort_order    int not null default 0,
  is_published  boolean not null default true,
  created_date  date not null default current_date,
  updated_at    timestamptz not null default now()
);

create table combos (
  id               serial primary key,
  character_id     int not null references characters on delete cascade,
  title            jsonb,
  notation_classic text not null,
  notation_modern  text,                     -- 비어 있으면 "클래식 전용"
  starter_move_id  int references moves on delete set null,
  hit_states       text[] not null default '{normal}'
                   check (hit_states <@ array['normal', 'counter', 'punish_counter', 'impact']),
  position_start   screen_position not null default 'midscreen',
  position_end     screen_position,
  drive_cost       numeric(2, 1) not null default 0 check (drive_cost between 0 and 6),
  sa_cost          int not null default 0 check (sa_cost between 0 and 3),
  damage           int,
  difficulty       difficulty not null default 'normal',
  notes            jsonb,
  media_url        text,
  youtube_url      text,
  youtube_start    int,
  target_level     target_level not null default 'beginner',
  patch_id         int references patches,
  sort_order       int not null default 0,
  is_published     boolean not null default true,
  created_date     date not null default current_date,
  updated_at       timestamptz not null default now()
);

create table setups (
  id               serial primary key,
  character_id     int not null references characters on delete cascade,
  title            jsonb not null check (has_ko(title)),
  situations       text[] not null default '{}',     -- setup_situations.slug 목록
  notation_classic text,
  notation_modern  text,
  description      jsonb,
  difficulty       difficulty not null default 'normal',
  media_url        text,
  youtube_url      text,
  youtube_start    int,
  target_level     target_level not null default 'beginner',
  patch_id         int references patches,
  sort_order       int not null default 0,
  is_published     boolean not null default true,
  created_date     date not null default current_date,
  updated_at       timestamptz not null default now()
);

-- 프랙티스 세팅
--   리버설 슬롯 형식: [{"notation": "2LP", "label": {"ko": "앉아 약손"}}, ...]
--   녹화 슬롯 여러 개는 기본적으로 랜덤 재생
create table practice_settings (
  id              serial primary key,
  character_id    int not null references characters on delete cascade,
  title           jsonb not null check (has_ko(title)),
  description     jsonb,
  guard           text not null default 'all'
                  check (guard in ('none', 'all', 'after_first', 'random')),
  wakeup_slots    jsonb not null default '[]',        -- 기상 시
  after_guard_count int,                              -- N번 가드 후 (null 이면 매번)
  after_guard_slots jsonb not null default '[]',      -- 가드 후
  after_hit_slots jsonb not null default '[]',        -- 데미지 받은 뒤
  playback        text not null default 'random' check (playback in ('random', 'sequential')),
  extra_settings  jsonb not null default '[]',        -- [{"label": {...}, "value": {...}}] 그 밖의 설정
  target_level    target_level not null default 'beginner',
  patch_id        int references patches,
  sort_order      int not null default 0,
  is_published    boolean not null default true,
  created_date    date not null default current_date,
  updated_at      timestamptz not null default now()
);

-- Vs Guide: 확정 반격표
create table vs_punishes (
  id             serial primary key,
  character_id   int not null references characters on delete cascade,   -- 내 캐릭터
  opponent_id    int not null references characters on delete cascade,   -- 상대 캐릭터
  opponent_move  jsonb not null check (has_ko(opponent_move)),
  opponent_input text,                                                    -- 상대 기술 커맨드
  on_block       text,                                                    -- 가드 시 프레임
  punish_classic text not null,
  punish_modern  text,
  notes          jsonb,
  target_level   target_level not null default 'beginner',
  patch_id       int references patches,
  sort_order     int not null default 0,
  is_published   boolean not null default true,
  created_date   date not null default current_date,
  updated_at     timestamptz not null default now()
);

-- Vs Guide: 패턴 대응
create table vs_patterns (
  id           serial primary key,
  character_id int not null references characters on delete cascade,
  opponent_id  int not null references characters on delete cascade,
  title        jsonb not null check (has_ko(title)),
  pattern      jsonb not null check (has_ko(pattern)),     -- 상대가 하는 행동
  response     jsonb not null check (has_ko(response)),    -- 대응 방법
  media_url    text,
  youtube_url  text,
  youtube_start int,
  target_level target_level not null default 'beginner',
  patch_id     int references patches,
  sort_order   int not null default 0,
  is_published boolean not null default true,
  created_date date not null default current_date,
  updated_at   timestamptz not null default now()
);

create table glossary (
  id           serial primary key,
  term         jsonb not null check (has_ko(term)),
  aliases      text[] not null default '{}',      -- 본문 자동 툴팁에 쓸 다른 표기
  description  jsonb not null check (has_ko(description)),
  target_level target_level not null default 'beginner',
  sort_order   int not null default 0,
  is_published boolean not null default true,
  created_date date not null default current_date,
  updated_at   timestamptz not null default now()
);

-- 항목 간 연결: "이 콤보가 끝나면 → 이 셋업", "이 셋업 연습 → 이 프랙티스 세팅"
create table item_links (
  id         serial primary key,
  from_type  item_type not null,
  from_id    int not null,
  to_type    item_type not null,
  to_id      int not null,
  sort_order int not null default 0,
  unique (from_type, from_id, to_type, to_id)
);

-- ───────────────────────── updated_at 자동 갱신 ─────────────────────────

create function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['overview_sections', 'moves', 'combos', 'setups', 'practice_settings',
                           'vs_punishes', 'vs_patterns', 'glossary']
  loop
    execute format('create trigger %I_touch before update on %I for each row execute function touch_updated_at()', t, t);
  end loop;
end $$;

-- ───────────────────────── RLS ─────────────────────────
-- 공개 읽기: is_published 인 행만 / 관리자: 전부 읽고 쓰기

do $$
declare t text;
begin
  -- is_published 컬럼이 있는 테이블
  foreach t in array array['characters', 'overview_sections', 'moves', 'combos', 'setups',
                           'practice_settings', 'vs_punishes', 'vs_patterns', 'glossary']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "public read" on %I for select using (is_published or is_admin())', t);
    execute format('create policy "admin write" on %I for all using (is_admin()) with check (is_admin())', t);
  end loop;

  -- 항상 공개인 테이블
  foreach t in array array['patches', 'setup_situations', 'item_links']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "public read" on %I for select using (true)', t);
    execute format('create policy "admin write" on %I for all using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

create policy "admin read self" on admins for select using (user_id = auth.uid());

-- ───────────────────────── 인덱스 ─────────────────────────

create index on overview_sections (character_id, sort_order);
create index on moves (character_id, category, sort_order);
create index on combos (character_id, sort_order);
create index on setups (character_id, sort_order);
create index on practice_settings (character_id, sort_order);
create index on vs_punishes (character_id, opponent_id, sort_order);
create index on vs_patterns (character_id, opponent_id, sort_order);
create index on item_links (from_type, from_id);
create index on item_links (to_type, to_id);
