-- Vs 가이드: 한 포스트에 상대 패턴 여러 개, 패턴마다 대응 여러 개.
--   patterns = [{
--     "classic": "236P", "modern": null,            상대 기술 표기
--     "name": {"ko": "장풍"}, "note": {"ko": "..."},  이름 · 설명
--     "frame_min": -8, "frame_max": -12,            프레임 범위 (거리에 따라 다를 때. 하나만 적으면 단일 값)
--     "youtube_url": "...", "youtube_start": null, "youtube_end": null, "youtube_loop": false,   패턴별 영상
--     "responses": [{"classic": "2MP → 236HP", "modern": null, "note": {"ko": "..."}, "punish": "confirmed" | "range" | null}]
--   }, ...]
--   punish: 딜캐 구분 (확정 / 거리 한정), 관리자가 직접 고른다
--
-- 기존 선택지(actions)는 '이름 없는 패턴 1개 + 그 대응들'로 옮기고 actions 는 비운다 (칼럼은 남김).
-- 일괄 수정이 '최근 수정자' · 변경 이력에 남지 않도록 트리거를 잠시 끈다.

alter table vs_guides add column patterns jsonb not null default '[]'::jsonb check (jsonb_typeof(patterns) = 'array');

alter table vs_guides disable trigger user;

update vs_guides
set patterns = jsonb_build_array(jsonb_build_object(
      'classic', '',
      'modern', null,
      'name', null,
      'note', null,
      'frame_min', null,
      'frame_max', null,
      'youtube_url', null,
      'youtube_start', null,
      'youtube_end', null,
      'youtube_loop', false,
      'responses', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'classic', coalesce(a->>'classic', ''),
          'modern', a->'modern',
          'note', a->'note',
          'punish', null
        )), '[]'::jsonb)
        from jsonb_array_elements(actions) as a
      )
    )),
    actions = '[]'::jsonb
where jsonb_array_length(actions) > 0;

alter table vs_guides enable trigger user;
