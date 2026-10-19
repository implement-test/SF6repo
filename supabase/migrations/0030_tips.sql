-- 플레이 팁 탭 (셋업 탭 오른쪽): 히트 확인 · 주요 기본기 · 공통 대처 · 운영 등 캐릭터별 운영 팁
--   셋업 · 추천 연습과 같은 구조(머리 줄 + 옵션 + 결과별 분기)이고,
--   주제(topic)와 커맨드 리스트의 기술 연결(move_ids, 카드에 프레임을 함께 보여 준다)이 더 있다.
--   옵션 분기의 결과에 '조건(직접 입력)'(custom + label)이 생겼지만 options 는 jsonb 라 칼럼 변경은 없다.

create table tips (
  id               serial primary key,
  character_id     int not null references characters on delete cascade,
  -- 주제: 히트 확인 / 주요 기본기 / 공통 대처 / 운영 / 기타
  topic            text not null default 'hit_confirm'
                   check (topic in ('hit_confirm', 'key_moves', 'defense', 'gameplan', 'other')),
  title            jsonb not null check (has_ko(title)),
  situation        jsonb check (situation is null or has_ko(situation)),
  notation_classic text,
  notation_modern  text,
  description      jsonb check (description is null or has_ko(description)),
  options          jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  practice         jsonb,
  -- 연결한 커맨드 리스트의 기술 (moves.id). 지워진 기술은 화면에서 건너뛴다
  move_ids         int[] not null default '{}',
  media_url        text,
  youtube_url      text,
  youtube_start    int,
  youtube_end      int,
  youtube_loop     boolean not null default false,
  target_level     target_level not null default 'beginner',
  patch_id         int references patches,
  sort_order       int not null default 0,
  is_published     boolean not null default true,
  created_date     date not null default current_date,
  created_by       uuid,
  updated_by       uuid,
  updated_at       timestamptz not null default now()
);
create index on tips (character_id, sort_order);

alter table tips enable row level security;
create policy "public read" on tips for select using (is_published or is_admin());
create policy "admin write" on tips for all
  using (can_edit_character(character_id)) with check (can_edit_character(character_id));

create trigger tips_touch before update on tips for each row execute function touch_updated_at();
create trigger tips_stamp before insert on tips for each row execute function touch_updated_at();
create trigger tips_log after insert or update or delete on tips for each row execute function log_change();

-- 즐겨찾기(나중에 로그인을 붙이면 쓰는 표, 0023)에도 플레이 팁(tip)을 담을 수 있게
alter table user_favorites drop constraint if exists user_favorites_kind_check;
alter table user_favorites add constraint user_favorites_kind_check
  check (kind in ('combo', 'setup', 'practice', 'vs', 'guide', 'tip'));
