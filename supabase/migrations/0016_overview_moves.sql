-- 개요 / 커맨드 리스트 (supercombo 위키 캐릭터 페이지 구성을 참고)
--
-- 개요: 캐릭터마다 한 건. 소개 글 + 장점 / 단점 + 클래식·모던 차이
--   pros, cons, modern_notes = [{ko, en?, ja?}, ...]  (한 줄씩)
-- 커맨드 리스트: 기존 moves 표. 분류에 '타겟 콤보' 를 더하고 영상 구간 칸을 맞춘다.
-- (0001 의 overview_sections 는 쓰지 않는다)

alter type move_category add value if not exists 'target_combo' after 'unique';

alter table moves
  add column youtube_end  int,
  add column youtube_loop boolean not null default false;

create table character_overviews (
  id           serial primary key,
  character_id int not null unique references characters on delete cascade,
  summary      jsonb check (summary is null or has_ko(summary)),
  pros         jsonb not null default '[]'::jsonb check (jsonb_typeof(pros) = 'array'),
  cons         jsonb not null default '[]'::jsonb check (jsonb_typeof(cons) = 'array'),
  modern_notes jsonb not null default '[]'::jsonb check (jsonb_typeof(modern_notes) = 'array'),
  patch_id     int references patches,
  is_published boolean not null default true,
  created_date date not null default current_date,
  created_by   uuid,
  updated_by   uuid,
  updated_at   timestamptz not null default now()
);

alter table character_overviews enable row level security;
create policy "public read" on character_overviews for select using (is_published or is_admin());
create policy "admin write" on character_overviews for all
  using (can_edit_character(character_id)) with check (can_edit_character(character_id));

create trigger character_overviews_touch before update on character_overviews
  for each row execute function touch_updated_at();
create trigger character_overviews_stamp before insert on character_overviews
  for each row execute function touch_updated_at();
create trigger character_overviews_log after insert or update or delete on character_overviews
  for each row execute function log_change();
