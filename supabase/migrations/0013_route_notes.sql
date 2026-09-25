-- 루트별 메모. 콤보 메모(notes)는 모든 루트 공용.
-- 루트 1의 메모는 route_note, 2번째부터는 extra_routes 각 항목의 note ({ko, en?, ja?}).

alter table combos add column route_note jsonb;
