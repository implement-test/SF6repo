-- YouTube 구간 반복: 시작(youtube_start, 기존) ~ 끝(youtube_end) 구간만 재생하고, youtube_loop 이면 반복한다.
-- 셋업 옵션의 영상은 setups.options(jsonb) 안에 같은 값을 둔다.

alter table combos
  add column youtube_end  int check (youtube_end is null or youtube_end > 0),
  add column youtube_loop boolean not null default false;

alter table setups
  add column youtube_end  int check (youtube_end is null or youtube_end > 0),
  add column youtube_loop boolean not null default false;
