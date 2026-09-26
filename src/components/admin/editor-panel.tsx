"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ENTITIES, type Field } from "@/lib/admin/entities";
import { copyValues } from "@/lib/admin/copy";
import { VsCopyTo } from "./vs-copy";
import { findUnknownTokens, parseNotation } from "@/lib/notation/parse";
import { describeError, revalidateSite, supabaseBrowser } from "@/lib/supabase/browser";
import type { ComboRoute, Localized, Patch, PracticeConfig, SetupOption, StarterGroup, VsAction } from "@/lib/types";
import { parseYouTube } from "@/lib/youtube";
import { normalizeOptions, normalizePractice } from "@/lib/setup";
import { normalizeStarterGroups } from "@/lib/starters";
import { comboRoutes, routesToColumns } from "@/lib/combo-routes";
import { RoutesInput } from "./routes-input";
import { LocalizedListInput, cleanLocalizedList } from "./localized-list-input";
import { VsActionsInput, cleanVsActions } from "./vs-actions-input";
import { normalizeVsActions } from "@/lib/vs-actions";
import { NotationImage } from "../notation";
import { draftKey, useAdmin, type EditorDraft, type EditorRequest } from "./admin-context";
import { formatPatchVersion } from "@/lib/patch";
import { History, useAuthorNames } from "./history";
import { StarterGroupsInput, cleanStarterGroups, inputClass } from "./starters-input";
import { ClockInput } from "./clock-input";
import {
  ComboLinksInput,
  OptionsInput,
  PracticeInput,
  SituationsInput,
  cleanOptions,
  cleanPractice,
} from "./setup-fields";

type Values = Record<string, unknown>;

/** 이전 형식으로 저장된 셋업 옵션·프랙티스 설정을 현재 형식으로 맞춘다 */
function normalizeValues(v: Values): Values {
  const out = { ...v };
  if ("options" in out) out.options = normalizeOptions(out.options);
  if ("practice" in out) out.practice = normalizePractice(out.practice);
  if ("starters" in out) out.starters = normalizeStarterGroups(out.starters);
  if ("actions" in out) out.actions = normalizeVsActions(out.actions);
  // 콤보: 칼럼(첫 번째 루트) + extra_routes 를 루트 목록 하나로
  if (!("routes" in out) && "drive_cost" in out) out.routes = comboRoutes(out as Parameters<typeof comboRoutes>[0]);
  return out;
}
const LANGS = [
  { key: "ko", label: "한국어" },
  { key: "en", label: "English" },
  { key: "ja", label: "日本語" },
] as const;

/** 관리자 편집 패널. entities.ts 의 필드 정의대로 폼을 그린다. */
export default function EditorPanel({ request, onClose }: { request: EditorRequest; onClose: () => void }) {
  const entity = ENTITIES[request.entity];
  const router = useRouter();
  const { bumpData, openEditor, getDraft, setDraft, clearDraft } = useAdmin();
  const key = draftKey(request);
  const sb = supabaseBrowser();
  const isNew = request.id === undefined;
  const usesPatch = entity.groups.some((g) => g.fields.some((f) => f.type === "patch"));
  const usesComboLinks = entity.groups.some((g) => g.fields.some((f) => f.type === "comboLinks"));

  const [values, setValues] = useState<Values | null>(null);
  /** 불러왔을 때 연결돼 있던 콤보 (셋업). 저장할 때 달라진 것만 반영한다. */
  const [initialLinks, setInitialLinks] = useState<number[]>([]);
  /** 불러왔을 때의 updated_at. 저장할 때 다른 관리자가 먼저 고쳤는지 확인한다. */
  const [baseUpdatedAt, setBaseUpdatedAt] = useState<string | null>(null);
  const [patches, setPatches] = useState<Patch[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const authors = useAuthorNames();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 닫기 전에 작성하던 내용을 복원했는지 */
  const [restored, setRestored] = useState(false);
  /** '처음부터 다시' 를 누르면 늘려서 다시 불러온다 */
  const [reloadN, setReloadN] = useState(0);
  /** 불러온 그대로의 내용 (닫을 때 바뀐 것이 있는지 비교) */
  const loaded = useRef<string | null>(null);
  const saved = useRef(false);
  const latest = useRef<EditorDraft | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const patchList = usesPatch
        ? ((await sb.from("patches").select("*").order("released_on", { ascending: false })).data ?? [])
        : [];
      let initial: Values;
      if (isNew) {
        initial = { ...entity.defaults(), patch_id: patchList[0]?.id ?? null, ...request.defaults, ...request.initial };
      } else {
        const { data, error } = await sb.from(entity.table).select("*").eq("id", request.id).single();
        if (error) {
          if (!cancelled) setError(describeError(error));
          return;
        }
        initial = data;
        if (usesComboLinks) {
          const { data: links } = await sb
            .from("setup_combos")
            .select("combo_id")
            .eq("setup_id", request.id)
            .order("sort_order");
          initial.combo_links = (links ?? []).map((l) => l.combo_id);
        }
      }
      if (cancelled) return;
      setPatches(patchList);
      const normalized = normalizeValues(initial);
      loaded.current = JSON.stringify(normalized);
      // 저장하지 않고 닫았던 내용이 있으면 그것으로
      const draft = key ? getDraft(key) : undefined;
      setRestored(!!draft);
      setValues(draft ? draft.values : normalized);
      setInitialLinks(draft ? draft.initialLinks : ((initial.combo_links as number[] | undefined) ?? []));
      setBaseUpdatedAt(draft ? draft.baseUpdatedAt : ((initial.updated_at as string | undefined) ?? null));
    })();
    return () => {
      cancelled = true;
    };
  }, [sb, entity, isNew, request.id, request.defaults, request.initial, usesPatch, usesComboLinks, key, getDraft, reloadN]);

  // 작성 중인 내용을 브라우저에 저장한다: 입력하는 동안 잠깐 멈출 때마다, 그리고 창이 닫힐 때.
  // 새로 고침은 창이 닫히는 과정 없이 일어나므로 입력 중에 계속 저장해 둔다. 바뀐 게 없으면 지운다.
  useEffect(() => {
    const snapshot = values ? { values, initialLinks, baseUpdatedAt } : null;
    latest.current = snapshot;
    if (!key || !snapshot || saved.current) return;
    const timer = setTimeout(() => {
      if (saved.current) return;
      if (JSON.stringify(snapshot.values) === loaded.current) clearDraft(key);
      else setDraft(key, snapshot);
    }, 400);
    return () => clearTimeout(timer);
  }, [values, initialLinks, baseUpdatedAt, key, setDraft, clearDraft]);
  useEffect(
    () => () => {
      if (!key || saved.current || !latest.current) return;
      if (JSON.stringify(latest.current.values) === loaded.current) clearDraft(key);
      else setDraft(key, latest.current);
    },
    [key, setDraft, clearDraft],
  );

  /** 기억해 둔 내용을 버리고 처음 상태로 다시 불러온다 */
  function startOver() {
    if (key) clearDraft(key);
    setRestored(false);
    setError(null);
    setReloadN((n) => n + 1);
  }

  /** 셋업 ↔ 콤보 연결 맞추기: 빠진 것은 지우고, 나머지는 순서까지 저장 */
  async function syncComboLinks(setupId: number): Promise<string | null> {
    if (!usesComboLinks || !values) return null;
    const wanted = (values.combo_links as number[] | undefined) ?? [];
    const removed = initialLinks.filter((id) => !wanted.includes(id));
    if (removed.length) {
      const { error } = await sb.from("setup_combos").delete().eq("setup_id", setupId).in("combo_id", removed);
      if (error) return describeError(error);
    }
    if (wanted.length) {
      const { error } = await sb.from("setup_combos").upsert(
        wanted.map((combo_id, sort_order) => ({ setup_id: setupId, combo_id, sort_order })),
        { onConflict: "setup_id,combo_id" },
      );
      if (error) return describeError(error);
    }
    return null;
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (key: string, value: unknown) => setValues((v) => ({ ...v, [key]: value }));

  async function finish() {
    // 저장·삭제했으면 기억해 둔 내용은 필요 없다
    saved.current = true;
    if (key) clearDraft(key);
    await revalidateSite(sb);
    bumpData();
    router.refresh();
    onClose();
  }

  async function save() {
    if (!values) return;
    const { payload, problem } = buildPayload(entity.groups.flatMap((g) => g.fields), values);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    const fail = (message: string) => {
      setBusy(false);
      setError(message);
    };

    if (isNew) {
      // 콤보·셋업은 새 항목을 목록 맨 아래에 둔다 (순서는 '순서 변경'에서 바꾼다)
      const order: Values = {};
      if (typeof request.defaults?.character_id === "number" && ["combos", "setups", "vs_guides", "moves", "videos"].includes(entity.table)) {
        const { data: last } = await sb
          .from(entity.table)
          .select("sort_order")
          .eq("character_id", request.defaults.character_id)
          .order("sort_order", { ascending: false })
          .limit(1);
        order.sort_order = (last?.[0]?.sort_order ?? -1) + 1;
      }
      const { data: inserted, error } = await sb
        .from(entity.table)
        .insert({ ...request.defaults, ...order, ...payload })
        .select("id")
        .single();
      if (error) return fail(describeError(error));
      const linkError = await syncComboLinks(inserted.id);
      if (linkError) return fail(`저장했지만 콤보 연결에 실패했습니다: ${linkError}`);
      return finish();
    }

    // 불러온 뒤 다른 관리자가 고쳤으면 덮어쓰지 않는다.
    let query = sb.from(entity.table).update(payload).eq("id", request.id);
    if (baseUpdatedAt) query = query.eq("updated_at", baseUpdatedAt);
    const { data, error } = await query.select("id");
    if (error) return fail(describeError(error));
    if (!data || data.length === 0) {
      const { data: current } = await sb.from(entity.table).select("*").eq("id", request.id).maybeSingle();
      if (current && baseUpdatedAt && current.updated_at !== baseUpdatedAt) {
        return fail(
          "다른 관리자가 먼저 수정했습니다. 창을 닫고 다시 열어 최신 내용을 확인하세요. (변경 이력에서 비교할 수 있습니다)",
        );
      }
      return fail("이 항목을 수정할 권한이 없습니다.");
    }
    const linkError = await syncComboLinks(request.id!);
    if (linkError) return fail(`저장했지만 콤보 연결에 실패했습니다: ${linkError}`);
    await finish();
  }

  async function remove() {
    if (!confirm(`이 ${entity.label}을(를) 삭제할까요?\n삭제한 항목은 관리 페이지의 '삭제된 항목'에서 복구할 수 있습니다.`))
      return;
    setBusy(true);
    const { data, error } = await sb.from(entity.table).delete().eq("id", request.id).select("id");
    if (error || !data || data.length === 0) {
      setBusy(false);
      setError(error ? describeError(error) : "이 항목을 삭제할 권한이 없습니다.");
      return;
    }
    await finish();
  }

  /**
   * 복사하기: 지금 폼의 내용으로 새 항목 창을 연다 (저장해야 만들어진다).
   * 제목에 '(복사본)'을 붙이고, 작성일은 오늘, 공개는 끈 상태로 시작한다.
   */
  function duplicate() {
    if (!values || request.id === undefined) return;
    openEditor({
      entity: request.entity,
      defaults: typeof values.character_id === "number" ? { character_id: values.character_id } : undefined,
      initial: copyValues(request.entity, values, { markCopy: true }),
    });
  }

  /** Vs 가이드: 다른 캐릭터(와 상대)로 복사한 새 항목 창을 연다 */
  function copyToCharacter(characterId: number, opponent: string) {
    if (!values) return;
    openEditor({
      entity: "vs",
      defaults: { character_id: characterId },
      initial: { ...copyValues("vs", values), opponent },
    });
  }

  /** 변경 이력의 한 시점 내용을 폼에 불러온다 (저장해야 반영된다). */
  function loadVersion(snapshot: Values) {
    // 연결 콤보는 이력에 없는 따로 저장되는 값이라 지금 값을 유지한다.
    setValues((current) =>
      normalizeValues({ ...snapshot, combo_links: current?.combo_links, updated_at: baseUpdatedAt }),
    );
    setShowHistory(false);
    setError("과거 버전을 불러왔습니다. 확인 후 저장하면 되돌려집니다.");
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${entity.label} ${isNew ? "추가" : "수정"}`}
        className="relative flex h-full w-full max-w-2xl flex-col border-l-2 border-accent bg-surface shadow-2xl"
      >
        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="eyebrow text-accent!">{isNew ? (request.initial ? "Copy" : "New") : `Edit #${request.id}`}</span>
          <h2 className="display text-2xl">
            {entity.label} {isNew ? "추가" : "수정"}
          </h2>
          <button type="button" onClick={onClose} className="ml-auto text-2xl leading-none text-muted hover:text-fg" aria-label="닫기">
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {!values ? (
            <p className="text-muted">{error ?? "불러오는 중…"}</p>
          ) : (
            <div className="flex flex-col gap-7">
              {restored && (
                <p className="flex flex-wrap items-center gap-2 border border-highlight/50 bg-highlight/10 px-3 py-2 text-sm">
                  창을 닫기 전에 작성하던 내용을 불러왔습니다.
                  <button type="button" onClick={startOver} className="ml-auto font-semibold text-highlight-text hover:underline">
                    처음부터 다시
                  </button>
                </p>
              )}
              {isNew && request.initial && (
                <p className="border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
                  원본 내용을 불러왔습니다. 필요한 부분을 고친 뒤 <b>저장</b>하면 새 항목이 만들어집니다.
                  {request.initial.is_published === false && " (공개는 꺼진 상태로 시작합니다)"}
                </p>
              )}
              {!isNew && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
                  <span>
                    작성 <b className="text-fg">{authors.get(values.created_by as string) ?? "—"}</b>
                  </span>
                  <span>
                    최근 수정 <b className="text-fg">{authors.get(values.updated_by as string) ?? "—"}</b>
                    {typeof values.updated_at === "string" && ` · ${new Date(values.updated_at).toLocaleString()}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowHistory((s) => !s)}
                    className="ml-auto font-semibold text-accent hover:underline"
                  >
                    {showHistory ? "이력 닫기" : "변경 이력"}
                  </button>
                </div>
              )}
              {showHistory && !isNew && (
                <History table={entity.table} rowId={String(request.id)} authors={authors} onLoad={loadVersion} />
              )}
              {entity.groups.map((group) => (
                <fieldset key={group.title} className="flex flex-col gap-3">
                  <legend className="mb-3 flex w-full items-center gap-2 border-b border-border pb-1.5">
                    <span aria-hidden className="skew inline-block h-3.5 w-1 bg-accent" />
                    <span className="text-sm font-bold">{group.title}</span>
                  </legend>
                  <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
                    {group.fields.map((field) => (
                      <div key={field.key} className={field.wide || field.type === "localized" ? "sm:col-span-2" : ""}>
                        <FieldInput
                          field={field}
                          value={values[field.key]}
                          onChange={(v) => set(field.key, v)}
                          patches={patches}
                          characterId={typeof values.character_id === "number" ? values.character_id : undefined}
                        />
                      </div>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          )}
        </div>

        <footer className="flex flex-col gap-2 border-t border-border bg-surface-2 px-5 py-3">
          {error && values && <p className="text-sm text-warn">{error}</p>}
          <div className="flex items-center gap-2">
            {!isNew && (
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="border border-warn/50 px-3 py-1.5 text-sm font-semibold text-warn hover:bg-warn/10 disabled:opacity-50"
              >
                삭제
              </button>
            )}
            {!isNew && typeof values?.character_id === "number" && (
              <button
                type="button"
                onClick={duplicate}
                disabled={busy}
                title="이 내용으로 새 항목을 만듭니다 (저장해야 만들어집니다)"
                className="border border-border-strong px-3 py-1.5 text-sm font-semibold text-muted hover:border-accent hover:text-accent disabled:opacity-50"
              >
                복사
              </button>
            )}
            {!isNew && request.entity === "vs" && values && (
              <VsCopyTo
                disabled={busy}
                currentCharacterId={values.character_id as number}
                opponent={values.opponent as string}
                onCopy={copyToCharacter}
              />
            )}
            <button type="button" onClick={onClose} className="ml-auto px-3 py-1.5 text-sm font-semibold text-muted hover:text-fg">
              취소
            </button>
            <button
              type="button"
              onClick={save}
              disabled={busy || !values}
              className="skew bg-accent px-5 py-1.5 text-sm font-bold text-accent-fg disabled:opacity-50"
            >
              <span>{busy ? "저장 중…" : "저장"}</span>
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

// ───────────────────────── 필드 ─────────────────────────


function Label({ field, children }: { field: Field; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted">
        {field.label}
        {field.required && <span className="text-accent"> *</span>}
      </span>
      {children}
      {field.help && <span className="text-xs text-muted">{field.help}</span>}
    </label>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  patches,
  characterId,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
  patches: Patch[];
  /** 편집 중인 항목의 캐릭터 (시동기 프리셋을 불러올 때 쓴다) */
  characterId?: number;
}) {
  switch (field.type) {
    case "localized": {
      const loc = (value as Partial<Localized> | null) ?? {};
      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">
            {field.label}
            {field.required && <span className="text-accent"> *</span>}
          </span>
          {LANGS.map((lang) => {
            const common = {
              value: loc[lang.key] ?? "",
              onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                onChange({ ...loc, [lang.key]: e.target.value }),
              placeholder: lang.key === "ko" ? "한국어 (필수)" : `${lang.label} (선택)`,
              className: inputClass,
              "aria-label": `${field.label} ${lang.label}`,
            };
            return (
              <div key={lang.key} className="grid grid-cols-[3.2rem_1fr] items-start gap-2">
                <span className="pt-1.5 text-xs font-bold uppercase text-muted">{lang.key}</span>
                {field.multiline ? (
                  // 줄바꿈(Enter / Shift+Enter)이 그대로 저장·표시된다. 내용에 맞춰 높이가 늘어난다.
                  <textarea rows={2} {...common} className={`${inputClass} field-sizing-content min-h-16 resize-y`} />
                ) : (
                  <input {...common} />
                )}
              </div>
            );
          })}
        </div>
      );
    }

    case "notation": {
      const text = (value as string | null) ?? "";
      const unknown = text ? findUnknownTokens(parseNotation(text)) : [];
      return (
        <Label field={field}>
          <input
            value={text}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            placeholder="예: 2MK → 236HP"
            className={`${inputClass} font-mono`}
          />
          {text && (
            <div className="flex min-h-11 items-center border-l-2 border-accent bg-inset px-3 py-2">
              <NotationImage notation={text} />
            </div>
          )}
          {unknown.length > 0 && <span className="text-xs text-warn">해석할 수 없는 부분: {unknown.join(", ")}</span>}
        </Label>
      );
    }

    case "starters":
      return (
        <StarterGroupsInput
          label={field.label}
          help={field.help}
          value={(value as StarterGroup[] | null) ?? []}
          onChange={onChange}
          characterId={characterId}
        />
      );

    case "vsActions":
      return (
        <VsActionsInput
          label={field.label}
          help={field.help}
          value={(value as VsAction[] | null) ?? []}
          onChange={onChange}
        />
      );

    case "localizedList":
      return (
        <LocalizedListInput
          label={field.label}
          help={field.help}
          value={(value as Partial<Localized>[] | null) ?? []}
          onChange={onChange}
        />
      );

    case "routes":
      return (
        <RoutesInput
          label={field.label}
          help={field.help}
          value={(value as ComboRoute[] | null) ?? []}
          onChange={onChange}
        />
      );

    case "situations":
      return <SituationsInput label={field.label} value={(value as string[] | null) ?? []} onChange={onChange} />;

    case "comboLinks":
      return (
        <ComboLinksInput
          label={field.label}
          help={field.help}
          characterId={characterId}
          value={(value as number[] | null) ?? []}
          onChange={onChange}
        />
      );

    case "setupOptions":
      return <OptionsInput value={(value as SetupOption[] | null) ?? []} onChange={onChange} />;

    case "practice":
      return <PracticeInput value={(value as PracticeConfig | null) ?? null} onChange={onChange} />;

    case "text":
    case "url": {
      const text = (value as string | null) ?? "";
      const yt = field.type === "url" ? parseYouTube(text) : null;
      return (
        <Label field={field}>
          <input
            type={field.type === "url" ? "url" : "text"}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
          {yt && (
            <span className="flex items-center gap-3 text-xs text-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- 관리자 미리보기용 썸네일 */}
              <img src={`https://i.ytimg.com/vi/${yt.id}/mqdefault.jpg`} alt="" className="h-14 border border-border" />
              <span>
                YouTube 영상 확인됨{yt.start ? ` · ${yt.start}초부터` : ""}
              </span>
            </span>
          )}
        </Label>
      );
    }

    case "number":
      return (
        <Label field={field}>
          <input
            type="number"
            step={field.step}
            min={field.min}
            max={field.max}
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
            className={`${inputClass} tabular-nums`}
          />
        </Label>
      );

    case "select":
      return (
        <Label field={field}>
          <select
            value={(value as string | null) ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
            className={inputClass}
          >
            {/* 아직 고르지 않은 필수 칸도 빈 선택지를 보여 준다 */}
            {(field.nullable || value === null || value === undefined || value === "") && <option value="">—</option>}
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Label>
      );

    case "multiselect": {
      const list = (value as string[] | null) ?? [];
      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">{field.label}</span>
          <div className="flex flex-wrap gap-1">
            {field.options.map((o) => {
              const on = list.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange(on ? list.filter((v) => v !== o.value) : [...list, o.value])}
                  className="skew border border-border-strong px-3 py-1 text-sm font-bold text-muted aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-fg"
                >
                  <span>{o.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    case "date":
      return (
        <Label field={field}>
          <input type="date" value={(value as string | null) ?? ""} onChange={(e) => onChange(e.target.value)} className={inputClass} />
        </Label>
      );

    case "checkbox":
      return (
        <div className="flex h-full flex-col justify-center gap-1 pt-5">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            {field.label}
          </label>
          {field.help && <span className="text-xs text-muted">{field.help}</span>}
        </div>
      );

    case "clock":
      return (
        <Label field={field}>
          <ClockInput value={(value as number | null) ?? null} onChange={onChange} />
        </Label>
      );

    case "patch":
      return (
        <Label field={field}>
          <select
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
            className={inputClass}
          >
            <option value="">— (지정 안 함)</option>
            {patches.map((p) => (
              <option key={p.id} value={p.id}>
                {formatPatchVersion(p.version)} ({p.released_on})
              </option>
            ))}
          </select>
        </Label>
      );
  }
}

// ───────────────────────── 저장 데이터 정리 ─────────────────────────

function buildPayload(fields: Field[], values: Values): { payload: Values; problem?: string } {
  const payload: Values = {};
  for (const field of fields) {
    const raw = values[field.key];
    switch (field.type) {
      case "localized": {
        const loc = (raw as Partial<Localized> | null) ?? {};
        const cleaned: Partial<Localized> = {};
        for (const { key } of LANGS) {
          const text = loc[key]?.trim();
          if (text) cleaned[key] = text;
        }
        const hasAny = Object.keys(cleaned).length > 0;
        if (hasAny && !cleaned.ko) return { payload, problem: `${field.label}: 한국어는 필수입니다.` };
        if (!hasAny && field.required) return { payload, problem: `${field.label}을(를) 입력하세요.` };
        payload[field.key] = hasAny ? cleaned : null;
        break;
      }
      case "notation":
      case "text":
      case "url": {
        const text = typeof raw === "string" ? raw.trim() : "";
        if (!text && field.required) return { payload, problem: `${field.label}을(를) 입력하세요.` };
        payload[field.key] = text || null;
        break;
      }
      case "number":
        payload[field.key] = raw === null || raw === undefined ? (field.nullable ? null : 0) : raw;
        break;
      case "starters":
        payload[field.key] = cleanStarterGroups(raw as StarterGroup[] | null);
        break;
      case "vsActions": {
        const list = cleanVsActions(raw as VsAction[] | null);
        if (list === "missing-ko") return { payload, problem: `${field.label}: 설명의 한국어는 필수입니다.` };
        payload[field.key] = list;
        break;
      }
      case "localizedList": {
        const list = cleanLocalizedList(raw as Partial<Localized>[] | null);
        if (list === "missing-ko") return { payload, problem: `${field.label}: 한국어는 필수입니다.` };
        payload[field.key] = list;
        break;
      }
      case "routes": {
        // 첫 번째 루트는 기존 칼럼, 나머지는 extra_routes 로 나눠 저장한다
        const columns = routesToColumns((raw as ComboRoute[] | null) ?? []);
        if (columns === "empty") return { payload, problem: "루트 1의 클래식 표기를 입력하세요." };
        if (columns === "missing-ko") return { payload, problem: "루트 메모: 한국어는 필수입니다." };
        Object.assign(payload, columns);
        break;
      }
      case "setupOptions":
        payload[field.key] = cleanOptions(raw as SetupOption[] | null);
        break;
      case "practice":
        payload[field.key] = cleanPractice(raw as PracticeConfig | null);
        break;
      case "situations":
        payload[field.key] = (raw as string[] | null) ?? [];
        break;
      case "checkbox":
        // 한 번도 누르지 않은 체크박스도 false 로 (DB 칼럼이 not null)
        payload[field.key] = raw === true;
        break;
      case "comboLinks":
        // 칼럼이 아니라 setup_combos 에 따로 저장한다 (syncComboLinks)
        break;
      case "date":
        // 비워 두면 보내지 않는다 (DB 기본값 = 오늘)
        if (raw) payload[field.key] = raw;
        break;
      case "select":
        // 필수 선택 칸을 비워 두면 DB 오류 대신 알려 준다
        if ((raw === null || raw === undefined || raw === "") && field.required)
          return { payload, problem: `${field.label}을(를) 고르세요.` };
        payload[field.key] = raw ?? null;
        break;
      default:
        payload[field.key] = raw ?? null;
    }
  }
  // 영상 구간 확인
  const start = typeof payload.youtube_start === "number" ? payload.youtube_start : 0;
  const end = payload.youtube_end;
  if (typeof end === "number" && end <= start) {
    return { payload, problem: "구간 끝은 구간 시작보다 뒤여야 합니다." };
  }
  if (payload.youtube_loop && typeof end !== "number") {
    return { payload, problem: "구간 반복을 쓰려면 구간 끝을 입력하세요." };
  }
  return { payload };
}
