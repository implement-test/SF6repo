-- 관리자 계층 + 작성자 기록 + 변경 이력
--
-- 역할
--   super     최고 관리자 (1명). 모든 권한. 부 관리자·캐릭터 관리자 임명/해임
--   sub       부 관리자. 모든 콘텐츠·공통 데이터 편집, 캐릭터 관리자 임명/해임 (다른 부 관리자는 관리 불가)
--   character 캐릭터 관리자. 맡은 캐릭터(여러 개 가능)의 콘텐츠만 편집.
--             Vs 가이드는 내 캐릭터·상대 캐릭터 중 한쪽이라도 맡고 있으면 편집 가능
-- 계정은 Supabase 대시보드에서 수동으로 만들고, 역할은 사이트 /admin 에서 지정한다.
-- 공개 전 검수 없음.

-- ───────────────────────── 역할 ─────────────────────────

create type admin_role as enum ('super', 'sub', 'character');

alter table admins
  add column role admin_role not null default 'character',
  add column display_name text not null default '',
  add column created_at timestamptz not null default now();

-- 지금까지의 관리자(1명)를 최고 관리자로
update admins set role = 'super' where user_id = (select user_id from admins limit 1);

-- 최고 관리자는 1명만
create unique index admins_single_super on admins (role) where role = 'super';

create table admin_characters (
  user_id      uuid not null references admins (user_id) on delete cascade,
  character_id int  not null references characters on delete cascade,
  primary key (user_id, character_id)
);
alter table admin_characters enable row level security;

create function my_admin_role() returns admin_role
language sql stable security definer set search_path = public as $$
  select role from admins where user_id = auth.uid()
$$;

create function is_manager() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(my_admin_role() in ('super', 'sub'), false)
$$;

create function can_edit_character(cid int) returns boolean
language sql stable security definer set search_path = public as $$
  select is_manager()
      or exists (select 1 from admin_characters where user_id = auth.uid() and character_id = cid)
$$;

-- ───────────────────────── 콘텐츠 쓰기 권한 ─────────────────────────

do $$
declare t text;
begin
  -- 캐릭터에 속한 콘텐츠: 그 캐릭터를 맡은 관리자
  foreach t in array array['overview_sections', 'moves', 'combos', 'setups', 'practice_settings']
  loop
    execute format('drop policy "admin write" on %I', t);
    execute format('create policy "admin write" on %I for all
      using (can_edit_character(character_id)) with check (can_edit_character(character_id))', t);
  end loop;

  -- Vs 가이드: 한쪽 캐릭터라도 맡고 있으면
  foreach t in array array['vs_punishes', 'vs_patterns']
  loop
    execute format('drop policy "admin write" on %I', t);
    execute format('create policy "admin write" on %I for all
      using (can_edit_character(character_id) or can_edit_character(opponent_id))
      with check (can_edit_character(character_id) or can_edit_character(opponent_id))', t);
  end loop;

  -- 공통 데이터: 최고/부 관리자만
  foreach t in array array['characters', 'patches', 'setup_situations', 'glossary']
  loop
    execute format('drop policy "admin write" on %I', t);
    execute format('create policy "admin write" on %I for all using (is_manager()) with check (is_manager())', t);
  end loop;
end $$;
-- item_links 는 모든 관리자가 쓸 수 있는 기존 정책을 유지한다.

-- ───────────────────────── 관리자 관리 권한 ─────────────────────────

create policy "managers read" on admins for select using (is_manager());

create policy "insert admins" on admins for insert with check (
  (my_admin_role() = 'super' and role <> 'super')
  or (my_admin_role() = 'sub' and role = 'character')
);

create policy "update admins" on admins for update
  using (
    my_admin_role() = 'super'
    or (my_admin_role() = 'sub' and role = 'character')
    or user_id = auth.uid()                    -- 자기 표시 이름 수정
  )
  with check (
    (my_admin_role() = 'super' and (role <> 'super' or user_id = auth.uid()))
    or (my_admin_role() = 'sub' and role = 'character')
    or user_id = auth.uid()
  );

create policy "delete admins" on admins for delete using (
  (my_admin_role() = 'super' and role <> 'super')
  or (my_admin_role() = 'sub' and role = 'character')
);

-- 정책으로 표현하기 어려운 규칙: 자기 역할 변경 금지, 최고 관리자 강등 금지
create function guard_admin_update() returns trigger
language plpgsql as $$
begin
  if new.user_id <> old.user_id then
    raise exception '관리자 계정은 바꿀 수 없습니다.';
  end if;
  if new.role <> old.role and old.user_id = auth.uid() then
    raise exception '자기 역할은 바꿀 수 없습니다.';
  end if;
  if old.role = 'super' and new.role <> 'super' then
    raise exception '최고 관리자의 역할은 바꿀 수 없습니다.';
  end if;
  return new;
end $$;

create trigger admins_guard before update on admins for each row execute function guard_admin_update();

create policy "admins read" on admin_characters for select using (is_admin());
create policy "managers write" on admin_characters for all
  using (
    my_admin_role() = 'super'
    or (my_admin_role() = 'sub'
        and exists (select 1 from admins a where a.user_id = admin_characters.user_id and a.role = 'character'))
  )
  with check (
    my_admin_role() = 'super'
    or (my_admin_role() = 'sub'
        and exists (select 1 from admins a where a.user_id = admin_characters.user_id and a.role = 'character'))
  );

-- 관리 화면용: 이메일로 계정 찾기 / 관리자 목록 (최고·부 관리자만 결과가 나온다)
create function find_user_id_by_email(p_email text) returns uuid
language sql stable security definer set search_path = public, auth as $$
  select id from auth.users where lower(email) = lower(trim(p_email)) and is_manager()
$$;

create function list_admins()
returns table (user_id uuid, email text, role admin_role, display_name text, character_ids int[], created_at timestamptz)
language sql stable security definer set search_path = public, auth as $$
  select a.user_id, u.email::text, a.role, a.display_name,
         coalesce(array_agg(ac.character_id order by ac.character_id)
                  filter (where ac.character_id is not null), '{}'),
         a.created_at
  from admins a
  join auth.users u on u.id = a.user_id
  left join admin_characters ac on ac.user_id = a.user_id
  where is_manager()
  group by a.user_id, u.email, a.role, a.display_name, a.created_at
  order by a.role, a.created_at
$$;

revoke execute on function find_user_id_by_email(text) from public, anon;
revoke execute on function list_admins() from public, anon;
grant execute on function find_user_id_by_email(text) to authenticated;
grant execute on function list_admins() to authenticated;

-- 방문자 화면의 작성자 표시용 이름 (공개).
-- 관리자에서 해임돼도 그동안 쓴 글의 작성자 이름이 남도록 admins 와 따로 보관한다.
create table author_names (
  user_id      uuid primary key,
  display_name text not null default ''
);
alter table author_names enable row level security;
create policy "public read" on author_names for select using (true);

create function sync_author_name() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into author_names (user_id, display_name) values (new.user_id, new.display_name)
  on conflict (user_id) do update set display_name = excluded.display_name;
  return new;
end $$;

create trigger admins_sync_author_name after insert or update of display_name on admins
  for each row execute function sync_author_name();

insert into author_names (user_id, display_name) select user_id, display_name from admins;

-- ───────────────────────── 작성자 / 수정자 ─────────────────────────

do $$
declare t text;
begin
  foreach t in array array['overview_sections', 'moves', 'combos', 'setups', 'practice_settings',
                           'vs_punishes', 'vs_patterns', 'glossary']
  loop
    -- 해임된 관리자의 기록도 남아야 하므로 admins 를 참조(FK)하지 않는다.
    execute format('alter table %I add column created_by uuid, add column updated_by uuid', t);
    -- 기존 항목은 최고 관리자가 쓴 것으로
    execute format('update %I set created_by = (select user_id from admins where role = ''super''),
                                  updated_by = (select user_id from admins where role = ''super'')', t);
    execute format('create trigger %I_stamp before insert on %I for each row execute function touch_updated_at()', t, t);
  end loop;
end $$;

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  if tg_op = 'INSERT' then
    -- 삭제된 항목을 복구할 때는 원래 작성자를 유지한다.
    new.created_by = coalesce(new.created_by, auth.uid());
  end if;
  return new;
end $$;

-- ───────────────────────── 변경 이력 ─────────────────────────

create table change_log (
  id         bigserial primary key,
  table_name text not null,
  row_id     text not null,
  action     text not null check (action in ('insert', 'update', 'delete')),
  changed_by uuid,
  changed_at timestamptz not null default now(),
  old_data   jsonb,
  new_data   jsonb
);
create index on change_log (table_name, row_id, changed_at desc);
create index on change_log (action, changed_at desc);

-- 관리자는 읽기만 가능. 기록은 트리거만 남긴다 (수정·삭제 불가).
alter table change_log enable row level security;
create policy "admins read" on change_log for select using (is_admin());

create function log_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  o jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  n jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  r jsonb := coalesce(n, o);
begin
  insert into change_log (table_name, row_id, action, changed_by, old_data, new_data)
  values (tg_table_name,
          coalesce(r->>'id', r->>'slug', r->>'user_id', ''),
          lower(tg_op), auth.uid(), o, n);
  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array array['overview_sections', 'moves', 'combos', 'setups', 'practice_settings',
                           'vs_punishes', 'vs_patterns', 'glossary', 'characters', 'patches',
                           'setup_situations', 'item_links', 'admins', 'admin_characters']
  loop
    execute format('create trigger %I_log after insert or update or delete on %I
                    for each row execute function log_change()', t, t);
  end loop;
end $$;
