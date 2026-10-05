-- 개인별 즐겨찾기 (나중에 구글 로그인을 붙일 때 쓴다)
--   지금은 즐겨찾기를 브라우저(localStorage)에만 저장한다. 로그인을 붙이면
--   브라우저에 있던 즐겨찾기를 이 표로 옮기고, 이후로는 계정별로 저장한다.
--   kind: combo / setup / practice / vs, item_id: 그 표의 id
--   지워진 항목은 화면에서 거른다 (여러 표를 가리키므로 외래 키를 두지 않음)

create table user_favorites (
  user_id    uuid not null references auth.users on delete cascade,
  kind       text not null check (kind in ('combo', 'setup', 'practice', 'vs')),
  item_id    int not null,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, item_id)
);

-- 본인 즐겨찾기만 보고 쓸 수 있다 (관리자도 남의 즐겨찾기는 못 본다)
alter table user_favorites enable row level security;
create policy "own read" on user_favorites for select using (auth.uid() = user_id);
create policy "own insert" on user_favorites for insert with check (auth.uid() = user_id);
create policy "own delete" on user_favorites for delete using (auth.uid() = user_id);
