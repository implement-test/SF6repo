-- Vs 가이드 한 항목에 관련 동작·대응을 여러 개. 각 선택지마다 표기와 설명을 단다.
--   body    = 공용 내용
--   actions = [{"classic": "...", "modern": "..." | null, "note": {"ko": ...} | null}, ...]
-- 기존의 표기 칸(notation_classic / notation_modern) 내용은 첫 번째 선택지로 옮기고 칸은 지운다.

alter table vs_guides
  add column actions jsonb not null default '[]'::jsonb check (jsonb_typeof(actions) = 'array');

update vs_guides
set actions = jsonb_build_array(
  jsonb_build_object('classic', notation_classic, 'modern', notation_modern, 'note', null)
)
where notation_classic is not null and notation_classic <> '';

alter table vs_guides
  drop column notation_classic,
  drop column notation_modern;
