-- 공통 공략: 특정 캐릭터가 아니라 모든 캐릭터에 통용되는 정보 (/guide)
--   1. 시스템 글(common_guides): 드라이브 시스템 · 공격 · 수비 같은 주제별 글
--   2. 공통 추천 연습 · 공통 추천 영상: practices / videos 에서 character_id 를 비운 행 (null = 공통)
--
-- 편집은 공통 데이터처럼 최고/부 관리자만 한다.
--   practices / videos 의 "admin write" 정책은 can_edit_character(character_id) 인데,
--   character_id 가 null 이면 is_manager() 만 남으므로 정책은 그대로 둔다.

alter table practices alter column character_id drop not null;
alter table videos alter column character_id drop not null;

create table common_guides (
  id               serial primary key,
  -- 주제: 시스템 / 공격 · 운영 / 수비 / 기타
  topic            text not null default 'system' check (topic in ('system', 'offense', 'defense', 'other')),
  title            jsonb not null check (has_ko(title)),
  body             jsonb check (body is null or has_ko(body)),
  notation_classic text,
  notation_modern  text,
  media_url        text,
  youtube_url      text,
  youtube_start    int,
  youtube_end      int,
  youtube_loop     boolean not null default false,
  target_level     target_level not null default 'beginner',
  patch_id         int references patches,
  sort_order       int not null default 0,
  is_published     boolean not null default true,
  created_date     date not null default current_date,
  created_by       uuid,
  updated_by       uuid,
  updated_at       timestamptz not null default now()
);
create index on common_guides (sort_order);

alter table common_guides enable row level security;
create policy "public read" on common_guides for select using (is_published or is_admin());
create policy "admin write" on common_guides for all using (is_manager()) with check (is_manager());

create trigger common_guides_touch before update on common_guides for each row execute function touch_updated_at();
create trigger common_guides_stamp before insert on common_guides for each row execute function touch_updated_at();
create trigger common_guides_log after insert or update or delete on common_guides for each row execute function log_change();

-- 즐겨찾기(나중에 로그인을 붙이면 쓰는 표, 0023)에도 시스템 글(guide)을 담을 수 있게
alter table user_favorites drop constraint if exists user_favorites_kind_check;
alter table user_favorites add constraint user_favorites_kind_check
  check (kind in ('combo', 'setup', 'practice', 'vs', 'guide'));
