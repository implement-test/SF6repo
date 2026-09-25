-- 한 콤보에 루트 여러 개.
-- 첫 번째 루트는 기존 칼럼(notation_classic, notation_modern, damage, drive_cost, sa_cost, frame_after),
-- 2번째부터는 extra_routes 에 [{classic, modern, damage, drive_cost, sa_cost, frame_after}, ...] 로 저장한다.

alter table combos add column extra_routes jsonb not null default '[]'::jsonb;
