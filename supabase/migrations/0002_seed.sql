-- 기본 데이터: 테리 + 셋업 상황 태그

insert into characters (slug, name, sort_order, is_published) values
  ('terry', '{"ko": "테리", "en": "Terry", "ja": "テリー"}', 1, true);

insert into setup_situations (slug, name, sort_order) values
  ('oki',         '{"ko": "기상 공격",  "en": "Okizeme",     "ja": "起き攻め"}',     1),
  ('safe_jump',   '{"ko": "안전 점프",  "en": "Safe jump",   "ja": "詐欺飛び"}',     2),
  ('after_throw', '{"ko": "잡기 후",    "en": "After throw", "ja": "投げ後"}',       3),
  ('after_combo', '{"ko": "콤보 후",    "en": "After combo", "ja": "コンボ後"}',     4);
