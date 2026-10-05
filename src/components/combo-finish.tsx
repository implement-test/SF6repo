import Link from "next/link";
import type { ComboFinish } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { LinkedSetup } from "@/lib/setup-links";
import { ControlNotation } from "./notation";

/**
 * 루트 끝의 마무리(FINISH) 배지. 마우스를 올리거나(휴대폰은 누르면) 마무리마다
 * 표기 · 데미지 · 후상황과 그 마무리에서 이어지는 셋업을 띄운다. 스크립트 없이 CSS(:hover, :focus-within)로 연다.
 * 배지와 팝업 사이를 투명한 여백(pt)으로 이어서 마우스를 옮기는 동안 닫히지 않게 하고,
 * 벗어난 뒤에도 잠깐 열어 두어 비스듬히 움직여도 셋업 링크를 누를 수 있게 한다.
 */
export function FinishBadge({
  finishes,
  setups = [],
  characterSlug,
  dict,
}: {
  finishes: ComboFinish[];
  /** 이 루트의 마무리에서 이어지는 셋업 (finishIndex 로 마무리를 고른다) */
  setups?: LinkedSetup[];
  characterSlug: string;
  dict: Dictionary;
}) {
  if (finishes.length === 0) return null;
  const hasSetups = setups.some((s) => s.finishIndex !== null && s.finishIndex < finishes.length);
  return (
    <span className="group/finish relative inline-flex align-middle">
      <button type="button" className="notation-finish cursor-help" aria-label={dict.combo.finish}>
        FINISH{finishes.length > 1 && <span className="not-italic tabular-nums">×{finishes.length}</span>}
        {hasSetups && <span aria-hidden className="size-1.5 rounded-full bg-highlight" title={dict.setup.linked} />}
      </button>
      <span
        role="tooltip"
        className="invisible absolute left-0 top-full z-30 pt-1.5 opacity-0 transition-[opacity,visibility] delay-200 duration-150 group-focus-within/finish:visible group-focus-within/finish:opacity-100 group-focus-within/finish:delay-0 group-hover/finish:visible group-hover/finish:opacity-100 group-hover/finish:delay-0"
      >
        <span className="flex w-max max-w-[min(34rem,85vw)] flex-col border border-highlight/60 bg-surface p-1 shadow-2xl">
          {finishes.map((f, i) => {
            const linked = setups.filter((s) => s.finishIndex === i);
            return (
              <span key={i} className="flex flex-col gap-1.5 px-2 py-1.5 odd:bg-surface-2">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="display w-4 text-right text-sm text-highlight-text">{i + 1}</span>
                  <span className="min-w-0">
                    <ControlNotation classic={f.classic} modern={f.modern} classicOnlyLabel={dict.combo.classicOnly} />
                  </span>
                  <FinishStats finish={f} dict={dict} />
                </span>
                {linked.length > 0 && (
                  <span className="pl-7">
                    <SetupChips setups={linked} characterSlug={characterSlug} dict={dict} />
                  </span>
                )}
              </span>
            );
          })}
        </span>
      </span>
    </span>
  );
}

/** 마무리 하나의 데미지 · 후상황 (글자로) */
export function FinishStats({ finish, dict }: { finish: ComboFinish; dict: Dictionary }) {
  if (finish.damage === null && !finish.frame_after) return null;
  return (
    <span className="ml-auto flex items-baseline gap-3 text-sm whitespace-nowrap">
      {finish.damage !== null && (
        <span>
          <span className="text-xs text-muted">{dict.combo.damage} </span>
          <b className="display tabular-nums text-highlight-text">{finish.damage.toLocaleString()}</b>
        </span>
      )}
      {finish.frame_after && (
        <span>
          <span className="text-xs text-muted">{dict.combo.frameAfter} </span>
          <b className="display tabular-nums">{finish.frame_after}</b>
        </span>
      )}
    </span>
  );
}

/** 이어지는 셋업 링크들. 마우스를 올리면 셋업 내용 미리보기, 누르면 셋업 페이지의 그 셋업으로 */
export function SetupChips({
  setups,
  characterSlug,
  dict,
}: {
  setups: LinkedSetup[];
  characterSlug: string;
  dict: Dictionary;
}) {
  if (setups.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="eyebrow">{dict.setup.linked}</span>
      {setups.map((s) => (
        <Link
          key={s.id}
          href={`/${characterSlug}/setups#setup-${s.id}`}
          title={s.preview}
          className="skew border border-highlight/60 px-2 py-0.5 text-xs font-bold text-highlight-text transition-colors hover:bg-highlight hover:text-highlight-fg"
        >
          <span>{s.title} →</span>
        </Link>
      ))}
    </span>
  );
}
