"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { describeError, revalidateSite, supabaseBrowser } from "@/lib/supabase/browser";
import { findUnknownTokens, parseNotation } from "@/lib/notation/parse";
import { MOVE_CATEGORIES, type MoveCategory } from "@/lib/types";
import {
  DEFAULT_COLUMNS,
  IMPORT_FIELDS,
  detectHeader,
  readRow,
  splitTable,
  type ImportField,
} from "@/lib/move-import";
import { useAdmin } from "./admin-context";
import { inputClass } from "./starters-input";
import { NotationImage } from "../notation";

const CATEGORY_LABELS: Record<MoveCategory, string> = {
  normal: "기본기",
  unique: "특수기",
  target_combo: "타겟 콤보",
  throw: "잡기",
  drive: "드라이브 시스템",
  special: "필살기",
  super: "슈퍼 아츠",
};

const EXAMPLE = "이름\t커맨드\t데미지\t발생\t지속\t경직\t히트\t가드\n서서 약펀치\t5LP\t300\t4\t3\t7\t+4\t-1";

/**
 * 커맨드 표 붙여넣기: 엑셀·구글 시트·웹 표에서 복사한 글을 미리 보고 한 번에 등록한다.
 * 첫 줄이 제목이면 열을 자동으로 맞추고, 아니면 기본 순서(이름·커맨드·데미지·발생·지속·경직·히트·가드).
 */
export default function MoveImportPanel({
  characterId,
  characterName,
  onClose,
}: {
  characterId: number;
  characterName: string;
  onClose: () => void;
}) {
  const sb = supabaseBrowser();
  const router = useRouter();
  const { bumpData } = useAdmin();
  const [text, setText] = useState("");
  const [override, setOverride] = useState<Record<number, ImportField>>({});
  const [defaultCategory, setDefaultCategory] = useState<MoveCategory>("normal");
  const [rowCategory, setRowCategory] = useState<Record<number, MoveCategory>>({});
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [asDraft, setAsDraft] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  // 붙여 넣은 글 → 표. 첫 줄이 제목이면 그 배치를 쓴다
  const table = useMemo(() => splitTable(text), [text]);
  const header = useMemo(() => (table.length ? detectHeader(table[0]) : null), [table]);
  const dataRows = header ? table.slice(1) : table;
  const width = Math.max(0, ...table.map((r) => r.length));
  const columns: ImportField[] = Array.from(
    { length: width },
    (_, i) => override[i] ?? (header ? header[i] : DEFAULT_COLUMNS[i]) ?? "skip",
  );

  const rows = dataRows.map((cells, i) => {
    const move = readRow(cells, columns);
    const category = rowCategory[i] ?? move.category ?? defaultCategory;
    const problem = !move.name ? "이름이 없습니다" : !move.input_classic ? "커맨드가 없습니다" : null;
    const unknown = move.input_classic ? findUnknownTokens(parseNotation(move.input_classic)) : [];
    return { i, move, category, problem, unknown, include: !excluded.has(i) && !problem };
  });
  const toImport = rows.filter((r) => r.include);

  function changeText(next: string) {
    setText(next);
    setOverride({});
    setRowCategory({});
    setExcluded(new Set());
    setError(null);
  }

  async function submit() {
    if (toImport.length === 0) return;
    setBusy(true);
    setError(null);
    const [{ data: patches }, { data: last }] = await Promise.all([
      sb.from("patches").select("id").order("released_on", { ascending: false }).limit(1),
      sb.from("moves").select("sort_order").eq("character_id", characterId).order("sort_order", { ascending: false }).limit(1),
    ]);
    const patchId = patches?.[0]?.id ?? null;
    let order = (last?.[0]?.sort_order ?? -1) + 1;
    const payload = toImport.map(({ move, category }) => ({
      character_id: characterId,
      category,
      name: { ko: move.name },
      input_classic: move.input_classic,
      input_modern: move.input_modern,
      damage: move.damage,
      startup: move.startup,
      active: move.active,
      recovery: move.recovery,
      on_hit: move.on_hit,
      on_block: move.on_block,
      notes: move.notes ? { ko: move.notes } : null,
      patch_id: patchId,
      is_published: !asDraft,
      sort_order: order++,
    }));
    const { data, error } = await sb.from("moves").insert(payload).select("id");
    if (error || !data?.length) {
      setBusy(false);
      setError(error ? describeError(error) : "이 캐릭터의 커맨드를 추가할 권한이 없습니다.");
      return;
    }
    await revalidateSite(sb);
    bumpData();
    router.refresh();
    onClose();
  }

  const cell = "px-2 py-1.5 align-top whitespace-nowrap";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" aria-label="닫기" onClick={() => !busy && onClose()} className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="커맨드 표 붙여넣기"
        className="relative flex max-h-[92vh] w-full max-w-6xl flex-col border border-accent bg-surface shadow-2xl"
      >
        <div className="brand-bar h-[3px]" />
        <header className="flex items-center gap-3 border-b border-border px-5 py-3">
          <span className="eyebrow text-accent!">Import</span>
          <h2 className="display text-2xl">{characterName} 커맨드 표 붙여넣기</h2>
          <button type="button" onClick={onClose} className="ml-auto text-2xl leading-none text-muted hover:text-fg" aria-label="닫기">
            ×
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">
              엑셀·구글 시트·웹 표에서 복사해 붙여 넣으세요. 첫 줄이 제목(이름·커맨드·데미지·발생·지속·경직·히트·가드 등)이면
              열을 자동으로 맞춥니다. 제목이 없으면 이 순서로 읽고, 아래에서 열마다 바꿀 수 있습니다.
            </span>
            <textarea
              value={text}
              onChange={(e) => changeText(e.target.value)}
              placeholder={EXAMPLE}
              spellCheck={false}
              className={`${inputClass} min-h-32 resize-y font-mono text-xs`}
            />
          </label>

          {table.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-muted">
                  {header ? "첫 줄을 제목으로 읽었습니다." : "제목 줄이 없어 기본 순서로 읽었습니다."} {dataRows.length}줄
                </span>
                <label className="ml-auto flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted">분류가 없는 줄</span>
                  <select
                    value={defaultCategory}
                    onChange={(e) => setDefaultCategory(e.target.value as MoveCategory)}
                    className="border border-border-strong bg-inset px-2 py-1 text-sm"
                  >
                    {MOVE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* 열 배치: 열마다 어떤 칸인지 */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">열 배치</span>
                <div className="flex flex-wrap gap-2">
                  {columns.map((field, i) => (
                    <label key={i} className="flex flex-col gap-1 border border-border bg-surface-2 p-2 text-xs">
                      <span className="max-w-32 truncate text-muted" title={dataRows[0]?.[i]}>
                        {i + 1}열: {header ? table[0][i] : (dataRows[0]?.[i] ?? "")}
                      </span>
                      <select
                        value={field}
                        onChange={(e) => setOverride({ ...override, [i]: e.target.value as ImportField })}
                        className="border border-border-strong bg-inset px-1.5 py-1 text-xs"
                      >
                        {IMPORT_FIELDS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </div>

              {/* 미리 보기 */}
              <div className="shrink-0 overflow-x-auto border border-border">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-surface-2 text-xs text-muted">
                    <tr>
                      {["", "분류", "이름", "커맨드", "데미지", "발생", "지속", "경직", "히트", "가드"].map((h, i) => (
                        <th key={i} className="px-2 py-1.5 text-left font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.i} className={`border-t border-border ${r.include ? "" : "opacity-45"}`}>
                        <td className={cell}>
                          <input
                            type="checkbox"
                            className="size-4 accent-[var(--accent)]"
                            checked={r.include}
                            disabled={!!r.problem}
                            onChange={() =>
                              setExcluded((prev) => {
                                const next = new Set(prev);
                                if (next.has(r.i)) next.delete(r.i);
                                else next.add(r.i);
                                return next;
                              })
                            }
                            aria-label={`${r.i + 1}번째 줄 포함`}
                          />
                        </td>
                        <td className={cell}>
                          <select
                            value={r.category}
                            onChange={(e) => setRowCategory({ ...rowCategory, [r.i]: e.target.value as MoveCategory })}
                            className="border border-border-strong bg-inset px-1.5 py-0.5 text-xs"
                          >
                            {MOVE_CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {CATEGORY_LABELS[c]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className={cell}>
                          {r.move.name || <span className="text-warn">—</span>}
                          {r.problem && <div className="text-xs text-warn">{r.problem}</div>}
                        </td>
                        <td className="px-2 py-1.5 align-top">
                          {r.move.input_classic && <NotationImage notation={r.move.input_classic} />}
                          {r.unknown.length > 0 && (
                            <div className="text-xs text-warn">해석할 수 없는 부분: {r.unknown.join(", ")}</div>
                          )}
                        </td>
                        {(["damage", "startup", "active", "recovery", "on_hit", "on_block"] as const).map((k) => (
                          <td key={k} className={`${cell} tabular-nums`}>
                            {r.move[k] ?? <span className="text-muted">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-3 border-t border-border bg-surface-2 px-5 py-3">
          {error && <p className="text-sm text-warn">{error}</p>}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={asDraft} onChange={(e) => setAsDraft(e.target.checked)} />
            비공개로 등록 (확인 후 공개)
          </label>
          <button type="button" onClick={onClose} className="ml-auto px-3 py-1.5 text-sm text-muted hover:text-fg">
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || toImport.length === 0}
            className="skew bg-accent px-5 py-1.5 text-sm font-bold text-accent-fg disabled:opacity-50"
          >
            <span>{busy ? "등록 중…" : `${toImport.length}개 등록`}</span>
          </button>
        </footer>
      </section>
    </div>
  );
}
