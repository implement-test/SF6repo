-- Vs 가이드: 내 캐릭터(character_id) 가 상대(opponent) 를 만났을 때의 공략 한 항목.
-- 상대는 로스터 slug (src/lib/roster.ts). 사이트에 페이지가 없는 캐릭터도 상대가 될 수 있어서 characters 를 참조하지 않는다.
-- 주제 5가지: 전체적인 운영 팁 / 윕퍼 노릴 만한 동작 / 가드 후 확정 딜캐 / 압박 중 끼어드는 지점 / 기타
-- (0001 의 vs_punishes / vs_patterns 는 쓰지 않는다)

create type vs_topic as enum ('general', 'whiff_punish', 'block_punish', 'pressure_gap', 'other');

create table vs_guides (
  id               serial primary key,
  character_id     int not null references characters on delete cascade,
  opponent         text not null,
  topic            vs_topic not null default 'general',
  title            jsonb check (title is null or has_ko(title)),
  body             jsonb check (body is null or has_ko(body)),
  -- 관련 동작/대응 표기 (선택)
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
create index on vs_guides (character_id, opponent, sort_order);

alter table vs_guides enable row level security;
create policy "public read" on vs_guides for select using (is_published or is_admin());
-- 한쪽 캐릭터라도 맡고 있으면 편집 가능 (상대 캐릭터는 slug 로 찾는다)
create policy "admin write" on vs_guides for all
  using (
    can_edit_character(character_id)
    or exists (select 1 from characters c where c.slug = opponent and can_edit_character(c.id))
  )
  with check (
    can_edit_character(character_id)
    or exists (select 1 from characters c where c.slug = opponent and can_edit_character(c.id))
  );

create trigger vs_guides_touch before update on vs_guides for each row execute function touch_updated_at();
create trigger vs_guides_stamp before insert on vs_guides for each row execute function touch_updated_at();
create trigger vs_guides_log after insert or update or delete on vs_guides for each row execute function log_change();
