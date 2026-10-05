-- 캐릭터 공개(is_published) On/Off 는 최고 관리자만 바꿀 수 있다.
-- characters 의 다른 칸(이름 등)은 지금처럼 최고/부 관리자가 고칠 수 있다 (0004).
-- SQL Editor 처럼 로그인 사용자가 없는 경우(auth.uid() 가 null)는 막지 않는다.

create function only_super_publishes_character() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.is_published is distinct from old.is_published
     and auth.uid() is not null
     and coalesce(my_admin_role() = 'super', false) = false then
    raise exception '캐릭터 공개 설정은 최고 관리자만 바꿀 수 있습니다.' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger characters_publish_super before update on characters
  for each row execute function only_super_publishes_character();
