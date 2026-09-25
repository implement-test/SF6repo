-- 32명 전원의 캐릭터 페이지를 만든다 (주소: /{slug}, 예: /ryu).
-- 순서는 src/lib/roster.ts 와 같다: 초기 로스터(가나다순) → 시즌 1 → 2 → 3 → 4.
-- 이미 있는 캐릭터(테리)는 이름·공개 여부는 그대로 두고 순서만 맞춘다.
-- 상단 배너와 목록 이미지는 공식 사이트 이미지를 slug 로 찾아 쓴다 (portrait_url 을 넣으면 그것이 우선).

insert into characters (slug, name, sort_order, is_published) values
  ('guile', '{"ko": "가일", "en": "Guile", "ja": "ガイル"}'::jsonb, 1, true),
  ('dhalsim', '{"ko": "달심", "en": "Dhalsim", "ja": "ダルシム"}'::jsonb, 2, true),
  ('deejay', '{"ko": "디제이", "en": "Dee Jay", "ja": "ディージェイ"}'::jsonb, 3, true),
  ('luke', '{"ko": "루크", "en": "Luke", "ja": "ルーク"}'::jsonb, 4, true),
  ('ryu', '{"ko": "류", "en": "Ryu", "ja": "リュウ"}'::jsonb, 5, true),
  ('lily', '{"ko": "릴리", "en": "Lily", "ja": "リリー"}'::jsonb, 6, true),
  ('manon', '{"ko": "마농", "en": "Manon", "ja": "マノン"}'::jsonb, 7, true),
  ('marisa', '{"ko": "마리사", "en": "Marisa", "ja": "マリーザ"}'::jsonb, 8, true),
  ('blanka', '{"ko": "블랑카", "en": "Blanka", "ja": "ブランカ"}'::jsonb, 9, true),
  ('ehonda', '{"ko": "E.혼다", "en": "E. Honda", "ja": "E.本田"}'::jsonb, 10, true),
  ('zangief', '{"ko": "장기에프", "en": "Zangief", "ja": "ザンギエフ"}'::jsonb, 11, true),
  ('jamie', '{"ko": "제이미", "en": "Jamie", "ja": "ジェイミー"}'::jsonb, 12, true),
  ('jp', '{"ko": "JP", "en": "JP", "ja": "JP"}'::jsonb, 13, true),
  ('juri', '{"ko": "주리", "en": "Juri", "ja": "ジュリ"}'::jsonb, 14, true),
  ('chunli', '{"ko": "춘리", "en": "Chun-Li", "ja": "春麗"}'::jsonb, 15, true),
  ('cammy', '{"ko": "캐미", "en": "Cammy", "ja": "キャミィ"}'::jsonb, 16, true),
  ('ken', '{"ko": "켄", "en": "Ken", "ja": "ケン"}'::jsonb, 17, true),
  ('kimberly', '{"ko": "킴벌리", "en": "Kimberly", "ja": "キンバリー"}'::jsonb, 18, true),
  ('rashid', '{"ko": "라시드", "en": "Rashid", "ja": "ラシード"}'::jsonb, 19, true),
  ('aki', '{"ko": "A.K.I.", "en": "A.K.I.", "ja": "A.K.I."}'::jsonb, 20, true),
  ('ed', '{"ko": "에드", "en": "Ed", "ja": "エド"}'::jsonb, 21, true),
  ('akuma', '{"ko": "고우키", "en": "Akuma", "ja": "豪鬼"}'::jsonb, 22, true),
  ('mbison', '{"ko": "베가", "en": "M. Bison", "ja": "ベガ"}'::jsonb, 23, true),
  ('terry', '{"ko": "테리", "en": "Terry", "ja": "テリー"}'::jsonb, 24, true),
  ('mai', '{"ko": "마이", "en": "Mai", "ja": "舞"}'::jsonb, 25, true),
  ('elena', '{"ko": "엘레나", "en": "Elena", "ja": "エレナ"}'::jsonb, 26, true),
  ('sagat', '{"ko": "사가트", "en": "Sagat", "ja": "サガット"}'::jsonb, 27, true),
  ('cviper', '{"ko": "C.바이퍼", "en": "C. Viper", "ja": "C.ヴァイパー"}'::jsonb, 28, true),
  ('alex', '{"ko": "알렉스", "en": "Alex", "ja": "アレックス"}'::jsonb, 29, true),
  ('ingrid', '{"ko": "잉그리드", "en": "Ingrid", "ja": "イングリッド"}'::jsonb, 30, true),
  ('yasmine', '{"ko": "야스민", "en": "Yasmine", "ja": "ヤスミン"}'::jsonb, 31, true),
  ('arjun', '{"ko": "아르준", "en": "Arjun", "ja": "アルジュン"}'::jsonb, 32, true)
on conflict (slug) do update set sort_order = excluded.sort_order;
