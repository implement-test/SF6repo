-- 콤보 구조 개편
--   1. 대상 수준을 초급 / 숙련 2단계로: 중급·상급 → 숙련('advanced'). 모든 콘텐츠 표에 적용
--   2. 콤보 태그(히트 상태)에 '기타'(other) 추가
--   3. 콤보의 드라이브·SA 게이지 소모 삭제
--   4. 루트마다 마무리(finish) 여러 개: 루트 1은 combos.finishes, 2번째부터는 extra_routes 항목 안의 finishes
--      [{"classic": "...", "modern": "...", "damage": 3200, "frame_after": "다운 +30"}, ...]
--   5. 콤보 그룹 (combo_groups, combos.group_id). 그룹도 순서가 있고, 그룹이 없는 콤보는 맨 위
--
-- 일괄 수정이 '최근 수정자'·변경 이력에 남지 않도록 표마다 사용자 트리거를 잠시 끈다.

-- ── 1. 대상 수준 2단계 ──
do $$
declare r record;
begin
  for r in
    select c.table_name
    from information_schema.columns c
    join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public' and c.udt_name = 'target_level' and t.table_type = 'BASE TABLE'
  loop
    execute format('alter table %I disable trigger user', r.table_name);
    execute format('update %I set target_level = %L where target_level = %L', r.table_name, 'advanced', 'intermediate');
    execute format('alter table %I alter column target_level drop default', r.table_name);
  end loop;

  alter type target_level rename to target_level_old;
  create type target_level as enum ('beginner', 'advanced');   -- 초급 / 숙련

  for r in
    select c.table_name
    from information_schema.columns c
    join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public' and c.udt_name = 'target_level_old' and t.table_type = 'BASE TABLE'
  loop
    execute format(
      'alter table %I alter column target_level type target_level using target_level::text::target_level',
      r.table_name
    );
    execute format('alter table %I alter column target_level set default %L', r.table_name, 'beginner');
    execute format('alter table %I enable trigger user', r.table_name);
  end loop;

  drop type target_level_old;
end $$;

-- ── 2~4. 콤보 ──
alter table combos disable trigger user;

alter table combos drop constraint combos_hit_states_check;
alter table combos add constraint combos_hit_states_check
  check (hit_states <@ array['normal', 'punish_counter', 'corner_impact_guard', 'corner_impact_stun', 'other']);

alter table combos drop column drive_cost, drop column sa_cost;
update combos
set extra_routes = coalesce(
  (select jsonb_agg(r - 'drive_cost' - 'sa_cost') from jsonb_array_elements(extra_routes) as r),
  '[]'::jsonb
)
where jsonb_array_length(extra_routes) > 0;

alter table combos add column finishes jsonb not null default '[]'::jsonb check (jsonb_typeof(finishes) = 'array');

alter table combos enable trigger user;

-- ── 5. 콤보 그룹 ──
create table combo_groups (
  id           serial primary key,
  character_id int not null references characters on delete cascade,
  name         jsonb not null check (has_ko(name)),
  sort_order   int not null default 0,
  created_by   uuid,
  updated_by   uuid,
  updated_at   timestamptz not null default now()
);
create index on combo_groups (character_id, sort_order);

alter table combo_groups enable row level security;
create policy "public read" on combo_groups for select using (true);
create policy "admin write" on combo_groups for all
  using (can_edit_character(character_id)) with check (can_edit_character(character_id));

create trigger combo_groups_touch before update on combo_groups for each row execute function touch_updated_at();
create trigger combo_groups_stamp before insert on combo_groups for each row execute function touch_updated_at();
create trigger combo_groups_log after insert or update or delete on combo_groups for each row execute function log_change();

-- 그룹을 지우면 콤보는 남고 그룹 없음이 된다
alter table combos add column group_id int references combo_groups on delete set null;
create index on combos (group_id);

-- 콤보를 다른 그룹으로 옮기는 것도 순서 변경이라 '최근 수정자'·변경 이력에 남기지 않는다 (0011, 0019)
create or replace function only_sort_order_changed(o jsonb, n jsonb) returns boolean
language sql immutable as $$
  select (o - 'sort_order' - 'patch_id' - 'group_id' - 'updated_at' - 'updated_by')
       = (n - 'sort_order' - 'patch_id' - 'group_id' - 'updated_at' - 'updated_by')
$$;
