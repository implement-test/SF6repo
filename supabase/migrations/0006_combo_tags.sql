-- 콤보 태그·수치 정리
--   히트 상태: 노멀 / 퍼니시 카운터 / 구석 임팩트 가드 / 구석 임팩트 스턴
--   위치: 시작 위치만 남기고, 거리 무관 / 필드 / 코너 근처 / 코너 / 기타
--   콤보 후 프레임 추가

-- ── 히트 상태 ──
alter table combos drop constraint combos_hit_states_check;

-- 이전 값 정리: 카운터는 없어지고, 임팩트는 '구석 임팩트 스턴'으로
update combos
set hit_states = array(
  select distinct case h when 'impact' then 'corner_impact_stun' else h end
  from unnest(hit_states) as h
  where h <> 'counter'
)
where hit_states && array['counter', 'impact'];

alter table combos add constraint combos_hit_states_check
  check (hit_states <@ array['normal', 'punish_counter', 'corner_impact_guard', 'corner_impact_stun']);

-- ── 위치 ──
alter type screen_position add value if not exists 'any' before 'midscreen';
alter type screen_position add value if not exists 'near_corner' after 'midscreen';

alter table combos drop column position_end;

-- ── 콤보 후 프레임 (예: "+32", "다운 +30") ──
alter table combos add column frame_after text;
