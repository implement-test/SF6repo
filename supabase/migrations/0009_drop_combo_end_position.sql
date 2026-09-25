-- 콤보 후 위치는 쓰지 않기로 했다 (콤보는 시작 위치만 둔다).
alter table combos drop column if exists end_position;
