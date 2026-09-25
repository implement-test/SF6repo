-- 시동기 프리셋: 캐릭터별로 자주 쓰는 시동기 묶음을 저장해 두고, 콤보를 쓸 때 불러온다.
--   starters 형식은 combos.starters 와 같다: [{"classic": "2LP → 2LP", "modern": "2L → 2L"}, ...]
-- 관리자 전용 도구라 방문자에게는 공개하지 않는다.

create table starter_presets (
  id           serial primary key,
  character_id int not null references characters on delete cascade,
  name         text not null check (length(trim(name)) > 0),
  starters     jsonb not null default '[]'::jsonb check (jsonb_typeof(starters) = 'array'),
  sort_order   int not null default 0,
  created_by   uuid,
  updated_by   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index on starter_presets (character_id, sort_order);

alter table starter_presets enable row level security;
create policy "admins read" on starter_presets for select using (is_admin());
create policy "admin write" on starter_presets for all
  using (can_edit_character(character_id)) with check (can_edit_character(character_id));

create trigger starter_presets_touch before update on starter_presets
  for each row execute function touch_updated_at();
create trigger starter_presets_stamp before insert on starter_presets
  for each row execute function touch_updated_at();
create trigger starter_presets_log after insert or update or delete on starter_presets
  for each row execute function log_change();
