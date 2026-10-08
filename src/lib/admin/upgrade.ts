/**
 * 변경 이력에 남아 있는 예전 형식의 행을 지금 DB 구조에 맞춘다
 * (삭제 복구, 편집 창의 '과거 버전 불러오기').
 *   - 0021: 대상 수준 중급·상급 → 숙련(advanced), 콤보의 드라이브·SA 소모 칼럼 삭제
 *   - 0027: Vs 가이드의 선택지(actions) → 이름 없는 상대 패턴 1개의 대응들
 */
export function upgradeRow(table: string, row: Record<string, unknown>): Record<string, unknown> {
  const out = { ...row };
  if (out.target_level === "intermediate") out.target_level = "advanced";
  if (table === "combos") {
    delete out.drive_cost;
    delete out.sa_cost;
    if (Array.isArray(out.extra_routes)) {
      out.extra_routes = out.extra_routes.map((r) => {
        if (!r || typeof r !== "object") return r;
        const rest = { ...(r as Record<string, unknown>) };
        delete rest.drive_cost;
        delete rest.sa_cost;
        return rest;
      });
    }
  }
  if (table === "vs_guides" && Array.isArray(out.actions) && out.actions.length > 0 && !Array.isArray(out.patterns)) {
    out.patterns = [
      {
        classic: "",
        modern: null,
        name: null,
        note: null,
        frame_min: null,
        frame_max: null,
        youtube_url: null,
        youtube_start: null,
        youtube_end: null,
        youtube_loop: false,
        responses: (out.actions as Record<string, unknown>[]).map((a) => ({
          classic: typeof a.classic === "string" ? a.classic : "",
          modern: a.modern ?? null,
          note: a.note ?? null,
          punish: null,
        })),
      },
    ];
    out.actions = [];
  }
  return out;
}
