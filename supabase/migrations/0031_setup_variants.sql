-- 셋업 포스트에 셋업 여러 개 (탭)
--   콤보 마무리마다 셋업을 만들면 포스트가 너무 많아져서, 한 포스트에 셋업 여러 개를 묶는다.
--   포스트: 제목 · 상황 태그 · 공통 설명(description) · 영상 · 공통 필드
--   셋업(variants 의 항목): 이름 · 셋업 초반 공통 루트(클래식/모던) · 설명 · 프랙티스 설정 · 옵션
--     [{"name": {"ko": "214MP 후"} | null, "notation_classic": "...", "notation_modern": null,
--       "description": {...} | null, "practice": {...} | null, "options": [...]}]
--   이어지는 엔더는 setup_enders 에 그대로 두고, 몇 번째 셋업으로 이어지는지 variant(0부터)로 적는다.
--
-- 기존 포스트는 옮기지 않는다: variants 가 비어 있으면 예전 칼럼(notation_classic · notation_modern · options · practice)을
-- 셋업 하나로 읽고(src/lib/setup.ts 의 setupVariants), 편집 창에서 저장하면 variants 로 옮기고 예전 칼럼은 비운다.

alter table setups
  add column variants jsonb not null default '[]'::jsonb check (jsonb_typeof(variants) = 'array');

-- 한 포스트 안에서 엔더 하나는 셋업 하나로만 이어진다 (unique (setup_id, ender_id) 그대로)
alter table setup_enders add column variant int not null default 0 check (variant >= 0);
