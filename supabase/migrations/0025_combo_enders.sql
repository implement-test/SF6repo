-- 엔더(콤보를 끝낸 기술) 목록과 셋업 ↔ 엔더 연결.
--   셋업은 콤보가 아니라 엔더에 연결한다. 시동 · 루트가 달라도 같은 기술로 끝나면 같은 셋업으로 이어진다.
--   콤보의 루트(마무리가 있으면 마무리)는 마지막 기술로 엔더를 자동으로 찾는다 (화면에서 계산).
--   자동으로 찾은 것과 다른 엔더를 쓰려면 루트 · 마무리에 ender_id 를 저장한다
--   (루트 1 = combos.ender_id, 마무리 · 2번째 루트부터는 finishes / extra_routes 항목의 ender_id).
--   후상황(frame_after)은 엔더의 값이 기본이고, 루트 · 마무리에 적은 값이 있으면 그것을 쓴다.
--
-- 이 파일은 지금 있는 콤보의 마지막 기술로 캐릭터별 엔더 목록을 만들고(후상황은 가장 많이 쓰인 값),
-- 0024 의 셋업 ↔ 루트(마무리) 연결을 셋업 ↔ 엔더 연결로 옮긴다. setup_combos 표는 더 쓰지 않는다 (지우지 않고 남김).

create table combo_enders (
  id               serial primary key,
  character_id     int not null references characters on delete cascade,
  notation_classic text not null,
  notation_modern  text,
  -- 같은 기술의 다른 상황을 나눌 때 붙이는 이름 (예: "카운터 히트")
  label            jsonb check (label is null or has_ko(label)),
  frame_after      text,
  note             jsonb check (note is null or has_ko(note)),
  sort_order       int not null default 0,
  created_by       uuid,
  updated_by       uuid,
  updated_at       timestamptz not null default now()
);
create index on combo_enders (character_id, sort_order);

alter table combo_enders enable row level security;
create policy "public read" on combo_enders for select using (true);
create policy "admin write" on combo_enders for all
  using (can_edit_character(character_id)) with check (can_edit_character(character_id));

create trigger combo_enders_touch before update on combo_enders for each row execute function touch_updated_at();
create trigger combo_enders_stamp before insert on combo_enders for each row execute function touch_updated_at();
create trigger combo_enders_log after insert or update or delete on combo_enders for each row execute function log_change();

-- 루트 1 이 자동으로 찾은 것과 다른 엔더를 쓸 때
alter table combos add column ender_id int references combo_enders on delete set null;

create table setup_enders (
  id         serial primary key,
  setup_id   int not null references setups on delete cascade,
  ender_id   int not null references combo_enders on delete cascade,
  sort_order int not null default 0,
  unique (setup_id, ender_id)
);
create index on setup_enders (ender_id);

alter table setup_enders enable row level security;
create policy "public read" on setup_enders for select using (true);
create policy "admin write" on setup_enders for all
  using (exists (select 1 from setups s where s.id = setup_id and can_edit_character(s.character_id)))
  with check (exists (select 1 from setups s where s.id = setup_id and can_edit_character(s.character_id)));

create trigger setup_enders_log after insert or update or delete on setup_enders
  for each row execute function log_change();

-- ── 지금 있는 콤보로 엔더 목록 만들기 ──

-- 표기의 마지막 기술 (→ / -> / > 로 나눈 마지막 조각, 생략 표시 { } 는 뺀다)
create function pg_temp.last_step(t text) returns text language sql immutable as $$
  select trim(x[array_length(x, 1)])
  from (select regexp_split_to_array(regexp_replace(coalesce(t, ''), '[{}]', ' ', 'g'), '\s*(→|->|>)\s*') as x) s
$$;
create function pg_temp.step_key(t text) returns text language sql immutable as $$
  select upper(regexp_replace(pg_temp.last_step(t), '\s+', ' ', 'g'))
$$;

-- 콤보의 끝 지점: 마무리가 없는 루트는 루트, 있으면 마무리 하나하나
create temp table combo_ends as
  select c.character_id, c.id as combo_id, 0 as route_index, null::int as finish_index,
         c.notation_classic as notation, c.frame_after
  from combos c
  where jsonb_array_length(c.finishes) = 0
  union all
  select c.character_id, c.id, 0, (f.ord - 1)::int, f.value->>'classic', f.value->>'frame_after'
  from combos c, jsonb_array_elements(c.finishes) with ordinality as f(value, ord)
  union all
  select c.character_id, c.id, r.ord::int, null, r.value->>'classic', r.value->>'frame_after'
  from combos c, jsonb_array_elements(c.extra_routes) with ordinality as r(value, ord)
  where jsonb_array_length(coalesce(r.value->'finishes', '[]'::jsonb)) = 0
  union all
  select c.character_id, c.id, r.ord::int, (f.ord - 1)::int, f.value->>'classic', f.value->>'frame_after'
  from combos c,
       jsonb_array_elements(c.extra_routes) with ordinality as r(value, ord),
       jsonb_array_elements(coalesce(r.value->'finishes', '[]'::jsonb)) with ordinality as f(value, ord);

insert into combo_enders (character_id, notation_classic, frame_after, sort_order)
select character_id,
       min(pg_temp.last_step(notation)),
       mode() within group (order by frame_after) filter (where frame_after is not null and frame_after <> ''),
       (row_number() over (partition by character_id order by pg_temp.step_key(notation)) - 1)::int
from combo_ends
where pg_temp.step_key(notation) <> ''
group by character_id, pg_temp.step_key(notation);

-- ── 셋업 ↔ 루트(마무리) 연결을 셋업 ↔ 엔더로 ──
insert into setup_enders (setup_id, ender_id, sort_order)
select l.setup_id, e.id, min(l.sort_order)
from setup_combos l
join combo_ends ce
  on ce.combo_id = l.combo_id
 and ce.route_index = l.route_index
 and coalesce(ce.finish_index, -1) = coalesce(l.finish_index, -1)
join combo_enders e
  on e.character_id = ce.character_id
 and upper(regexp_replace(e.notation_classic, '\s+', ' ', 'g')) = pg_temp.step_key(ce.notation)
group by l.setup_id, e.id
on conflict (setup_id, ender_id) do nothing;
