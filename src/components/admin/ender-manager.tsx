"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Combo, ComboEnder, Localized } from "@/lib/types";
import { comboRoutes } from "@/lib/combo-routes";
import { lastStepKey, routeEnds } from "@/lib/enders";
import { describeError, revalidateSite, supabaseBrowser } from "@/lib/supabase/browser";
import { useAdmin } from "./admin-context";
import { NotationImage } from "../notation";
import { inputClass } from "./starters-input";

/** 편집 중인 엔더. 새 엔더는 id 가 없다 */
type Row = {
  key: string;
  id: number | null;
  notation_classic: string;
  notation_modern: string;
  label: Localized | null;
  frame_after: string;
};

let newKey = 0;

const toRow = (e: ComboEnder): Row => ({
  key: `e${e.id}`,
  id: e.id,
  notation_classic: e.notation_classic,
  notation_modern: e.notation_modern ?? "",
  label: e.label,
  frame_after: e.frame_after ?? "",
});

const smallButton =
  "grid size-7 place-items-center border border-border-strong text-xs text-muted hover:border-accent hover:text-accent disabled:opacity-30";

/**
 * 엔더(콤보를 끝낸 기술) 관리 팝업. 셋업은 엔더에 연결하고, 콤보의 루트 · 마무리는 마지막 기술로 엔더를 자동으로 찾는다.
 * '콤보에서 찾아 추가'는 이 캐릭터 콤보의 마지막 기술 중 아직 엔더가 없는 것을 목록에 더한다 (후상황은 가장 많이 쓰인 값).
 */
export default function EnderManager({ characterId, onClose }: { characterId: number; onClose: () => void }) {
  const sb = supabaseBrowser();
  const router = useRouter();
  const { bumpData } = useAdmin();
  const [original, setOriginal] = useState<ComboEnder[] | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [e, c] = await Promise.all([
        sb.from("combo_enders").select("*").eq("character_id", characterId).order("sort_order").order("id"),
        sb.from("combos").select("*").eq("character_id", characterId),
      ]);
      if (e.error || c.error) setError(describeError((e.error ?? c.error)!));
      const list = (e.data ?? []) as ComboEnder[];
      setOriginal(list);
      setRows(list.map(toRow));
      setCombos((c.data ?? []) as Combo[]);
    })();
  }, [sb, characterId]);

  const dirty = !!original && JSON.stringify(rows) !== JSON.stringify(original.map(toRow));

  function close() {
    if (dirty && !confirm("바꾼 내용을 저장하지 않고 닫을까요?")) return;
    onClose();
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // 지금 목록(저장 전 포함)으로 셈한, 엔더마다 그 기술로 끝나는 콤보 수
  const asEnders: ComboEnder[] = rows.map((r, i) => ({
    id: r.id ?? -(i + 1),
    character_id: characterId,
    notation_classic: r.notation_classic,
    notation_modern: r.notation_modern || null,
    label: r.label,
    frame_after: r.frame_after || null,
    note: null,
    sort_order: i,
  }));
  const usage = new Map<number, number>();
  for (const combo of combos) {
    const ids = new Set(routeEnds(comboRoutes(combo), asEnders).flatMap((e) => (e.ender ? [e.ender.id] : [])));
    for (const id of ids) usage.set(id, (usage.get(id) ?? 0) + 1);
  }

  const update = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...rows];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setRows(next);
  };
  const addRow = (notation = "", frame = "") =>
    ({ key: `new${++newKey}`, id: null, notation_classic: notation, notation_modern: "", label: null, frame_after: frame }) as Row;

  /** 콤보의 마지막 기술 중 아직 엔더가 없는 것을 더한다 */
  function findFromCombos() {
    const known = new Set(rows.map((r) => lastStepKey(r.notation_classic)).filter(Boolean));
    const found = new Map<string, { notation: string; frames: string[]; count: number }>();
    for (const combo of combos) {
      for (const route of comboRoutes(combo)) {
        const ends = route.finishes.length > 0 ? route.finishes : [route];
        for (const end of ends) {
          const key = lastStepKey(end.classic);
          if (!key || known.has(key)) continue;
          const steps = end.classic.replace(/[{}]/g, " ").split(/\s*(?:→|->|>)\s*/);
          const entry = found.get(key) ?? { notation: steps[steps.length - 1].trim(), frames: [], count: 0 };
          entry.count++;
          if (end.frame_after) entry.frames.push(end.frame_after);
          found.set(key, entry);
        }
      }
    }
    if (found.size === 0) return setNotice("모든 콤보의 마지막 기술에 이미 엔더가 있습니다.");
    // 많이 쓰인 기술부터, 후상황은 가장 많이 적힌 값
    const added = [...found.values()]
      .sort((a, b) => b.count - a.count)
      .map((f) => addRow(f.notation, mostCommon(f.frames)));
    setRows([...rows, ...added]);
    setNotice(`엔더 ${added.length}개를 더했습니다. 확인 후 저장하세요.`);
  }

  async function save() {
    if (!original) return;
    const empty = rows.find((r) => !r.notation_classic.trim());
    if (empty) return setError("엔더 표기(클래식)를 입력하세요.");
    setBusy(true);
    setError(null);
    const fail = (message: string) => {
      setBusy(false);
      setError(message);
    };

    const kept = new Set(rows.map((r) => r.id).filter((id) => id !== null));
    const removed = original.filter((e) => !kept.has(e.id)).map((e) => e.id);
    if (removed.length > 0) {
      const { error } = await sb.from("combo_enders").delete().in("id", removed);
      if (error) return fail(describeError(error));
    }
    for (const [i, r] of rows.entries()) {
      const payload = {
        notation_classic: r.notation_classic.trim(),
        notation_modern: r.notation_modern.trim() || null,
        label: r.label?.ko?.trim() ? cleanLabel(r.label) : null,
        frame_after: r.frame_after.trim() || null,
        sort_order: i,
      };
      if (r.id === null) {
        const { error } = await sb.from("combo_enders").insert({ ...payload, character_id: characterId });
        if (error) return fail(describeError(error));
      } else {
        const before = original.find((e) => e.id === r.id);
        const same =
          before &&
          before.notation_classic === payload.notation_classic &&
          (before.notation_modern ?? null) === payload.notation_modern &&
          JSON.stringify(before.label ?? null) === JSON.stringify(payload.label) &&
          (before.frame_after ?? null) === payload.frame_after &&
          before.sort_order === i;
        if (same) continue;
        const { error } = await sb.from("combo_enders").update(payload).eq("id", r.id);
        if (error) return fail(describeError(error));
      }
    }
    await revalidateSite(sb);
    bumpData();
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" aria-label="닫기" onClick={close} className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="엔더 관리"
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col border border-accent bg-surface shadow-2xl"
      >
        <div className="brand-bar h-[3px]" />
        <header className="flex items-center gap-3 border-b border-border px-5 py-3">
          <span className="eyebrow text-accent!">Enders</span>
          <h2 className="display text-2xl">엔더 관리</h2>
          <button type="button" onClick={close} className="ml-auto text-2xl leading-none text-muted hover:text-fg" aria-label="닫기">
            ×
          </button>
        </header>
        <p className="border-b border-border px-5 py-2 text-xs text-muted">
          엔더 = 콤보를 끝낸 기술. 콤보의 루트 · 마무리는 마지막 기술이 같은 엔더(위에 있는 것부터)를 자동으로 쓰고, 셋업은 엔더에
          연결합니다. 후상황은 콤보에서 비워 두면 여기 값이 쓰입니다. 같은 기술의 다른 상황은 이름을 붙여 따로 만들고 콤보에서 직접
          고르세요.
        </p>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {original === null ? (
            <p className="text-sm text-muted">{error ?? "불러오는 중…"}</p>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_4rem_6.5rem] gap-2 px-2 text-xs font-semibold text-muted md:grid">
                <span>표기 (클래식) *</span>
                <span>표기 (모던)</span>
                <span>이름 (같은 기술 구분용)</span>
                <span>후상황 기본값</span>
                <span className="text-right">콤보</span>
                <span />
              </div>
              {rows.length === 0 && <p className="px-2 text-sm text-muted">아직 엔더가 없습니다. 아래에서 추가하거나 콤보에서 찾아 추가하세요.</p>}
              {rows.map((r, i) => (
                <div key={r.key} className="flex flex-col gap-2 border border-border bg-surface-2 p-2">
                  <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_1fr_4rem_6.5rem] md:items-center">
                    <input
                      value={r.notation_classic}
                      onChange={(e) => update(i, { notation_classic: e.target.value })}
                      placeholder="예: 214LP"
                      spellCheck={false}
                      className={`${inputClass} font-mono`}
                      aria-label="표기 (클래식)"
                    />
                    <input
                      value={r.notation_modern}
                      onChange={(e) => update(i, { notation_modern: e.target.value })}
                      placeholder="비우면 클래식 전용"
                      spellCheck={false}
                      className={`${inputClass} font-mono`}
                      aria-label="표기 (모던)"
                    />
                    <input
                      value={r.label?.ko ?? ""}
                      onChange={(e) => update(i, { label: { ...(r.label ?? {}), ko: e.target.value } })}
                      placeholder="예: 카운터 히트 (선택)"
                      className={inputClass}
                      aria-label="이름"
                    />
                    <input
                      value={r.frame_after}
                      onChange={(e) => update(i, { frame_after: e.target.value })}
                      placeholder="예: 다운 +30"
                      className={inputClass}
                      aria-label="후상황 기본값"
                    />
                    <span className="text-right text-sm text-muted tabular-nums" title="이 엔더로 끝나는 콤보 수">
                      {usage.get(r.id ?? -(i + 1)) ?? 0}
                    </span>
                    <span className="flex justify-end gap-1">
                      <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className={smallButton} aria-label="위로">
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={i === rows.length - 1}
                        onClick={() => move(i, 1)}
                        className={smallButton}
                        aria-label="아래로"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (r.id !== null && !confirm("이 엔더를 지울까요? 이 엔더에 연결된 셋업 연결도 함께 지워집니다.")) return;
                          setRows(rows.filter((_, j) => j !== i));
                        }}
                        className={`${smallButton} hover:border-warn! hover:text-warn!`}
                        aria-label="삭제"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                  {r.notation_classic.trim() && (
                    <div className="px-1">
                      <NotationImage notation={r.notation_classic} />
                    </div>
                  )}
                </div>
              ))}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRows([...rows, addRow()])}
                  className="border border-dashed border-border-strong px-3 py-1.5 text-sm font-semibold text-muted hover:border-accent hover:text-accent"
                >
                  + 엔더 추가
                </button>
                <button
                  type="button"
                  onClick={findFromCombos}
                  className="border border-dashed border-highlight/60 px-3 py-1.5 text-sm font-semibold text-highlight-text hover:bg-highlight/10"
                >
                  콤보에서 찾아 추가
                </button>
                {notice && <span className="self-center text-xs text-muted">{notice}</span>}
              </div>
            </div>
          )}
        </div>

        <footer className="flex items-center gap-2 border-t border-border bg-surface-2 px-5 py-3">
          {error && original && <p className="text-sm text-warn">{error}</p>}
          <button type="button" onClick={close} className="ml-auto px-3 py-1.5 text-sm text-muted hover:text-fg">
            취소
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy || !dirty}
            className="skew bg-accent px-5 py-1.5 text-sm font-bold text-accent-fg disabled:opacity-50"
          >
            <span>{busy ? "저장 중…" : "저장"}</span>
          </button>
        </footer>
      </section>
    </div>
  );
}

function mostCommon(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

/** 빈 번역은 뺀다 */
function cleanLabel(label: Localized): Localized {
  const out: Localized = { ko: label.ko.trim() };
  if (label.en?.trim()) out.en = label.en.trim();
  if (label.ja?.trim()) out.ja = label.ja.trim();
  return out;
}
