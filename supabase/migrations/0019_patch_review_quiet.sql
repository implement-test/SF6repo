-- 패치 갱신 작업(관리 페이지): 내용은 그대로 두고 기준 패치만 최신으로 바꾸는 것은
-- 순서 변경처럼 '최근 수정자' 와 변경 이력에 남기지 않는다.
-- 0011 의 only_sort_order_changed 가 sort_order 외에 patch_id 도 무시하게 한다 (트리거는 그대로).

create or replace function only_sort_order_changed(o jsonb, n jsonb) returns boolean
language sql immutable as $$
  select (o - 'sort_order' - 'patch_id' - 'updated_at' - 'updated_by')
       = (n - 'sort_order' - 'patch_id' - 'updated_at' - 'updated_by')
$$;
