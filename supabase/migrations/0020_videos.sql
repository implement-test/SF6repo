-- 캐릭터별 추천 영상 (YouTube)
--   language: 영상 언어 (ko / en / ja / other)
--   channel : 채널 이름 (출처 표기)

create table videos (
  id            serial primary key,
  character_id  int not null references characters on delete cascade,
  title         jsonb not null check (has_ko(title)),
  description   jsonb check (description is null or has_ko(description)),
  youtube_url   text not null,
  youtube_start int,
  youtube_end   int,
  youtube_loop  boolean not null default false,
  channel       text,
  language      text not null default 'ko' check (language in ('ko', 'en', 'ja', 'other')),
  target_level  target_level not null default 'beginner',
  patch_id      int references patches,
  sort_order    int not null default 0,
  is_published  boolean not null default true,
  created_date  date not null default current_date,
  created_by    uuid,
  updated_by    uuid,
  updated_at    timestamptz not null default now()
);
create index on videos (character_id, sort_order);

alter table videos enable row level security;
create policy "public read" on videos for select using (is_published or is_admin());
create policy "admin write" on videos for all
  using (can_edit_character(character_id)) with check (can_edit_character(character_id));

create trigger videos_touch before update on videos for each row execute function touch_updated_at();
create trigger videos_stamp before insert on videos for each row execute function touch_updated_at();
create trigger videos_log after insert or update or delete on videos for each row execute function log_change();
