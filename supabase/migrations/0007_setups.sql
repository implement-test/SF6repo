-- 셋업 페이지
--   셋업 = (이어지는 콤보들) + 셋업 입력 + 프랙티스 설정 + 옵션 A/B/...
--   한 콤보가 여러 셋업에, 한 셋업에 여러 콤보가 연결될 수 있다 (setup_combos).

-- 콤보 후 위치 (필드 / 코너). 필터용 태그가 아니라 셋업 화면에 보여 줄 정보.
alter table combos add column end_position screen_position;

-- 옵션: [{"label": "A", "classic": "...", "modern": "...", "description": {"ko": ...}, "youtube_url": "..."}]
-- 프랙티스 설정:
--   {"guard": "all", "playback": "random",
--    "wakeup": ["2LP", "LPLK"], "after_guard": {"count": 2, "slots": ["2LP", "4"]}, "after_hit": [],
--    "notes": {"ko": "..."}}
alter table setups
  add column options  jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  add column practice jsonb;

create table setup_combos (
  id         serial primary key,
  setup_id   int not null references setups on delete cascade,
  combo_id   int not null references combos on delete cascade,
  sort_order int not null default 0,
  unique (setup_id, combo_id)
);
create index on setup_combos (combo_id);

alter table setup_combos enable row level security;
create policy "public read" on setup_combos for select using (true);
create policy "admin write" on setup_combos for all
  using (exists (select 1 from setups s where s.id = setup_id and can_edit_character(s.character_id)))
  with check (exists (select 1 from setups s where s.id = setup_id and can_edit_character(s.character_id)));

create trigger setup_combos_log after insert or update or delete on setup_combos
  for each row execute function log_change();
