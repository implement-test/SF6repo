-- Vs 가이드 주제 목록 변경
--   윕퍼 노릴 동작(whiff_punish) / 가드 후 딜캐(block_punish) / 압박 사이 끼어들기(pressure_gap)
--   / 날먹·무뇌패턴 파해(cheese) / 주요 셋업(setup)
-- 빠지는 주제(전체적인 운영 팁 general, 기타 other)를 쓰던 항목은 '날먹·무뇌패턴 파해' 로 옮긴다.
-- enum 에 값을 더하면 같은 실행 안에서 쓸 수 없어서, 칸을 text + 검사 조건으로 바꾼다.

alter table vs_guides alter column topic drop default;
alter table vs_guides alter column topic type text using topic::text;

update vs_guides set topic = 'cheese' where topic in ('general', 'other');

alter table vs_guides
  add constraint vs_guides_topic_check
  check (topic in ('whiff_punish', 'block_punish', 'pressure_gap', 'cheese', 'setup'));
alter table vs_guides alter column topic set default 'whiff_punish';

drop type vs_topic;
