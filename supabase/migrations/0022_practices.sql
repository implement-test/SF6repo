-- 추천 연습 탭 (셋업 탭 오른쪽)
--   셋업과 같은 구조(공통 루트 + 옵션 + 트레이닝 모드 더미 설정)이고,
--   '이어지는 콤보' 대신 상황(situation)을 글로 적는다.

create table practices (
  id               serial primary key,
  character_id     int not null references characters on delete cascade,
  title            jsonb not null check (has_ko(title)),
  situation        jsonb check (situation is null or has_ko(situation)),
  notation_classic text,
  notation_modern  text,
  description      jsonb check (description is null or has_ko(description)),
  options          jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  practice         jsonb,
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
create index on practices (character_id, sort_order);

alter table practices enable row level security;
create policy "public read" on practices for select using (is_published or is_admin());
create policy "admin write" on practices for all
  using (can_edit_character(character_id)) with check (can_edit_character(character_id));

create trigger practices_touch before update on practices for each row execute function touch_updated_at();
create trigger practices_stamp before insert on practices for each row execute function touch_updated_at();
create trigger practices_log after insert or update or delete on practices for each row execute function log_change();
