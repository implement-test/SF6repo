-- Vs 가이드 주제에 '저스트 패리'(just_parry) 추가
alter table vs_guides drop constraint vs_guides_topic_check;
alter table vs_guides
  add constraint vs_guides_topic_check
  check (topic in ('whiff_punish', 'block_punish', 'pressure_gap', 'cheese', 'setup', 'just_parry'));
