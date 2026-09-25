-- 콤보 = 시동 기본기(여러 개 가능) + 루트
--   starters: [{"classic": "2LP → 2LP", "modern": "2L → 2L"}, {"classic": "5MP", "modern": null}, ...]
--   첫 번째 시동기가 데미지 기준이다.
--   기존 notation_classic / notation_modern 은 "루트" 로 쓴다.

alter table combos
  add column starters jsonb not null default '[]'::jsonb
  check (jsonb_typeof(starters) = 'array');

-- 커맨드 리스트의 기술을 가리키던 칸은 쓰지 않는다.
alter table combos drop column starter_move_id;
