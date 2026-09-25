"use client";

import { useEffect, useState } from "react";
import { describeError, supabaseBrowser } from "@/lib/supabase/browser";
import type { ComboStarter } from "@/lib/types";
import { NotationImage } from "../notation";
import { useAdmin } from "./admin-context";
import { StartersInput, cleanStarters, inputClass, type StarterPreset } from "./starters-input";

type Draft = { id?: number; name: string; starters: ComboStarter[] };

/** 캐릭터별 시동기 프리셋 관리 팝업 */
export default function PresetManager({
  characterId,
  characterName,
  onClose,
}: {
  characterId: number;
  characterName: string;
  onClose: () => void;
}) {
  const sb = supabaseBrowser();
  const { dataVersion, bumpData } = useAdmin();
  const [presets, setPresets] = useState<StarterPreset[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sb.from("starter_presets")
      .select("*")
      .eq("character_id", characterId)
      .order("sort_order")
      .order("id")
      .then(({ data, error }) => {
        if (error) setError(describeError(error));
        setPresets(data ?? []);
      });
  }, [sb, characterId, dataVersion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function select(preset: StarterPreset) {
    setError(null);
    setDraft({ id: preset.id, name: preset.name, starters: preset.starters });
  }

  async function save() {
    if (!draft) return;
    const name = draft.name.trim();
    const starters = cleanStarters(draft.starters);
    if (!name) return setError("프리셋 이름을 입력하세요.");
    if (starters.length === 0) return setError("시동기를 하나 이상 넣으세요.");
    setBusy(true);
    setError(null);
    const result = draft.id
      ? await sb.from("starter_presets").update({ name, starters }).eq("id", draft.id).select("*")
      : await sb
          .from("starter_presets")
          .insert({ character_id: characterId, name, starters, sort_order: presets?.length ?? 0 })
          .select("*");
    setBusy(false);
    if (result.error || !result.data?.length) {
      return setError(result.error ? describeError(result.error) : "이 캐릭터의 프리셋을 수정할 권한이 없습니다.");
    }
    const saved = result.data[0] as StarterPreset;
    setDraft({ id: saved.id, name: saved.name, starters: saved.starters });
    bumpData();
  }

  async function remove() {
    if (!draft?.id || !confirm(`'${draft.name}' 프리셋을 삭제할까요?\n이미 콤보에 불러온 시동기는 그대로 남습니다.`)) return;
    setBusy(true);
    const { data, error } = await sb.from("starter_presets").delete().eq("id", draft.id).select("id");
    setBusy(false);
    if (error || !data?.length) return setError(error ? describeError(error) : "삭제할 권한이 없습니다.");
    setDraft(null);
    bumpData();
  }

  async function move(preset: StarterPreset, dir: -1 | 1) {
    if (!presets) return;
    const i = presets.findIndex((p) => p.id === preset.id);
    const j = i + dir;
    if (j < 0 || j >= presets.length) return;
    const next = [...presets];
    [next[i], next[j]] = [next[j], next[i]];
    setPresets(next);
    // 순서를 0..n 으로 다시 매긴다
    await Promise.all(
      next.map((p, idx) => (p.sort_order === idx ? null : sb.from("starter_presets").update({ sort_order: idx }).eq("id", p.id))),
    );
    bumpData();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="시동기 프리셋 관리"
        className="relative flex max-h-[88vh] w-full max-w-4xl flex-col border border-accent bg-surface shadow-2xl"
      >
        <div className="brand-bar h-[3px]" />
        <header className="flex items-center gap-3 border-b border-border px-5 py-3">
          <span className="eyebrow text-accent!">Starter presets</span>
          <h2 className="display text-2xl">{characterName} 시동기 프리셋</h2>
          <button type="button" onClick={onClose} className="ml-auto text-2xl leading-none text-muted hover:text-fg" aria-label="닫기">
            ×
          </button>
        </header>

        <div className="grid min-h-0 flex-1 md:grid-cols-[16rem_1fr]">
          {/* 목록 */}
          <aside className="flex min-h-0 flex-col border-b border-border md:border-b-0 md:border-r">
            <div className="p-3">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setDraft({ name: "", starters: [{ classic: "", modern: null }] });
                }}
                className="skew w-full bg-accent py-1.5 text-sm font-bold text-accent-fg"
              >
                <span>+ 새 프리셋</span>
              </button>
            </div>
            <ul className="max-h-48 overflow-y-auto md:max-h-none md:flex-1">
              {presets === null && <li className="px-4 py-2 text-sm text-muted">불러오는 중…</li>}
              {presets?.length === 0 && <li className="px-4 py-2 text-sm text-muted">아직 프리셋이 없습니다.</li>}
              {presets?.map((p, i) => (
                <li key={p.id} data-selected={draft?.id === p.id} className="group flex items-center border-l-2 border-transparent data-[selected=true]:border-accent data-[selected=true]:bg-surface-2">
                  <button type="button" onClick={() => select(p)} aria-current={draft?.id === p.id ? "true" : undefined} className="flex min-w-0 flex-1 flex-col items-start px-3 py-2 text-left hover:bg-surface-2">
                    <span className="w-full truncate text-sm font-semibold">{p.name}</span>
                    <span className="text-xs text-muted">시동기 {p.starters.length}개</span>
                  </button>
                  <span className="flex flex-col pr-2 opacity-60 group-hover:opacity-100">
                    <button type="button" disabled={i === 0} onClick={() => move(p, -1)} className="px-1 text-xs text-muted hover:text-fg disabled:opacity-30" aria-label="위로">
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={i === presets.length - 1}
                      onClick={() => move(p, 1)}
                      className="px-1 text-xs text-muted hover:text-fg disabled:opacity-30"
                      aria-label="아래로"
                    >
                      ▼
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </aside>

          {/* 편집 */}
          <div className="flex min-h-0 flex-col">
            {!draft ? (
              <div className="grid flex-1 place-items-center p-8 text-center text-sm text-muted">
                <div className="flex flex-col gap-2">
                  <p>왼쪽에서 프리셋을 고르거나 새로 만드세요.</p>
                  <p>콤보를 쓸 때 시동기 칸의 &lsquo;프리셋&rsquo;에서 불러올 수 있습니다.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="flex flex-col gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-muted">
                        프리셋 이름 <span className="text-accent">*</span>
                      </span>
                      <input
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        placeholder="예: 약 시동 / 앉아 중킥 시동"
                        className={inputClass}
                      />
                    </label>
                    <StartersInput
                      label="시동기"
                      value={draft.starters}
                      onChange={(starters) => setDraft({ ...draft, starters })}
                      damageBasis={false}
                    />
                    {draft.starters.some((s) => s.classic.trim()) && (
                      <div className="flex flex-col gap-1.5 border border-border bg-inset p-3">
                        <span className="eyebrow">Preview</span>
                        {cleanStarters(draft.starters).map((s, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="display w-4 text-right text-muted">{i + 1}</span>
                            <NotationImage notation={s.classic} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <footer className="flex flex-col gap-2 border-t border-border bg-surface-2 px-5 py-3">
                  {error && <p className="text-sm text-warn">{error}</p>}
                  <div className="flex items-center gap-2">
                    {draft.id && (
                      <button
                        type="button"
                        onClick={remove}
                        disabled={busy}
                        className="border border-warn/50 px-3 py-1.5 text-sm font-semibold text-warn hover:bg-warn/10 disabled:opacity-50"
                      >
                        삭제
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={save}
                      disabled={busy}
                      className="skew ml-auto bg-accent px-5 py-1.5 text-sm font-bold text-accent-fg disabled:opacity-50"
                    >
                      <span>{busy ? "저장 중…" : draft.id ? "저장" : "만들기"}</span>
                    </button>
                  </div>
                </footer>
              </>
            )}
          </div>
        </div>
        {!draft && error && <p className="border-t border-border px-5 py-2 text-sm text-warn">{error}</p>}
      </section>
    </div>
  );
}
