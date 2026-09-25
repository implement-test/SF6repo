-- 순서만 바꾼 수정은 '최근 수정자'와 변경 이력에 남기지 않는다.
-- (관리자 모드의 순서 변경 창은 sort_order 만 고친다)

create or replace function only_sort_order_changed(o jsonb, n jsonb) returns boolean
language sql immutable as $$
  select (o - 'sort_order' - 'updated_at' - 'updated_by') = (n - 'sort_order' - 'updated_at' - 'updated_by')
$$;

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' and only_sort_order_changed(to_jsonb(old), to_jsonb(new)) then
    new.updated_at = old.updated_at;
    new.updated_by = old.updated_by;
    return new;
  end if;
  new.updated_at = now();
  new.updated_by = auth.uid();
  if tg_op = 'INSERT' then
    -- 삭제된 항목을 복구할 때는 원래 작성자를 유지한다.
    new.created_by = coalesce(new.created_by, auth.uid());
  end if;
  return new;
end $$;

create or replace function log_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  o jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  n jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  r jsonb := coalesce(n, o);
begin
  if tg_op = 'UPDATE' and only_sort_order_changed(o, n) then
    return null;
  end if;
  insert into change_log (table_name, row_id, action, changed_by, old_data, new_data)
  values (tg_table_name,
          coalesce(r->>'id', r->>'slug', r->>'user_id', ''),
          lower(tg_op), auth.uid(), o, n);
  return null;
end $$;
