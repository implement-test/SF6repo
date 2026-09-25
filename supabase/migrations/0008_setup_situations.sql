-- 셋업 '상황' 선택지를 거리 무관 / 필드 / 코너 로 바꾼다.
-- (잡기 후 셋업은 셋업 입력에 f.throw / b.throw 로 적는다)

-- 기존 셋업에 남은 이전 태그는 뺀다
update setups
set situations = array(select s from unnest(situations) as s where s in ('any', 'midscreen', 'corner'))
where not (situations <@ array['any', 'midscreen', 'corner']);

delete from setup_situations where slug not in ('any', 'midscreen', 'corner');

insert into setup_situations (slug, name, sort_order) values
  ('any',       '{"ko": "거리 무관", "en": "Any range", "ja": "距離不問"}', 1),
  ('midscreen', '{"ko": "필드",     "en": "Midscreen", "ja": "画面中央"}', 2),
  ('corner',    '{"ko": "코너",     "en": "Corner",    "ja": "画面端"}',   3)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;
