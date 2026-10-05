-- 셋업을 콤보 단위가 아니라 콤보의 루트(마무리) 단위로 연결한다.
--   route_index : 콤보의 몇 번째 루트인지 (0 = 루트 1)
--   finish_index: 그 루트의 몇 번째 마무리인지 (null = 마무리 없음 / 루트 전체)
-- 기존 연결은 루트 1(0), 마무리 없음으로 남는다.
-- 같은 셋업이 한 콤보의 여러 루트 · 마무리에 연결될 수 있다.

alter table setup_combos
  add column route_index  int not null default 0 check (route_index >= 0),
  add column finish_index int check (finish_index is null or finish_index >= 0);

alter table setup_combos drop constraint if exists setup_combos_setup_id_combo_id_key;
create unique index setup_combos_target
  on setup_combos (setup_id, combo_id, route_index, coalesce(finish_index, -1));
