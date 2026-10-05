import type { ComboFinish } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { ControlNotation } from "./notation";

/**
 * 루트 끝의 마무리(FINISH) 배지. 마우스를 올리거나(휴대폰은 누르면) 마무리마다
 * 표기 · 데미지 · 후상황을 띄운다. 스크립트 없이 CSS(:hover, :focus-within)로 연다.
 */
export function FinishBadge({ finishes, dict }: { finishes: ComboFinish[]; dict: Dictionary }) {
  if (finishes.length === 0) return null;
  return (
    <span className="group/finish relative inline-flex align-middle">
      <button type="button" className="notation-finish cursor-help" aria-label={dict.combo.finish}>
        FINISH{finishes.length > 1 && <span className="not-italic tabular-nums">×{finishes.length}</span>}
      </button>
      <span
        role="tooltip"
        className="invisible absolute left-0 top-full z-30 mt-1.5 flex w-max max-w-[min(34rem,85vw)] flex-col border border-highlight/60 bg-surface p-1 opacity-0 shadow-2xl transition-opacity group-focus-within/finish:visible group-focus-within/finish:opacity-100 group-hover/finish:visible group-hover/finish:opacity-100"
      >
        {finishes.map((f, i) => (
          <span key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-1.5 odd:bg-surface-2">
            <span className="display w-4 text-right text-sm text-highlight-text">{i + 1}</span>
            <span className="min-w-0">
              <ControlNotation classic={f.classic} modern={f.modern} classicOnlyLabel={dict.combo.classicOnly} />
            </span>
            <FinishStats finish={f} dict={dict} />
          </span>
        ))}
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
