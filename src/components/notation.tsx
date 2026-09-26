import { Fragment } from "react";
import {
  isSituation,
  displayNotation,
  parseNotation,
  type Modifier,
  type Move,
  type Situation,
} from "@/lib/notation/parse";
import { BUTTON_ICONS, SYSTEM_ICONS, directionIcons, type IconRef } from "@/lib/notation/icons";

function Icon({ icon }: { icon: IconRef }) {
  if (icon.overlay) {
    return (
      <span className="relative inline-grid place-items-center">
        <Icon icon={{ ...icon, overlay: undefined }} />
        <span aria-hidden className="notation-overlay">
          {icon.overlay}
        </span>
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 작은 정적 아이콘이라 next/image 가 필요 없다
    <img
      src={icon.src}
      alt={icon.alt}
      title={icon.alt}
      className="notation-icon"
      data-flip={icon.flip}
      data-wide={icon.wide ? "" : undefined}
      loading="lazy"
      decoding="async"
    />
  );
}

const SITUATION_LABELS: Record<Situation, string> = { air: "AIR", counter: "COUNTER", punish: "PUNISH" };

/**
 * 히트 상황 배지 (air / counter / punish).
 * 커맨드 아이콘(둥근 버튼·방향키)과 헷갈리지 않도록 오른쪽을 가리키는 리본 모양으로 그린다.
 */
function SituationBadge({ situation }: { situation: Situation }) {
  return (
    <span className="notation-situation" data-situation={situation} title={SITUATION_LABELS[situation]}>
      {SITUATION_LABELS[situation]}
    </span>
  );
}

/**
 * 딜레이 배지. 커맨드(버튼·방향키·파란 판)도, 히트 상황(채워진 리본)도 아닌 타이밍 지시라서
 * 속이 빈 점선 알약 + 스톱워치 모양으로 그린다.
 */
function DelayBadge() {
  return (
    <span className="notation-delay" title="delay">
      <svg viewBox="0 0 16 16" aria-hidden className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="8" cy="9.2" r="5.3" />
        <path d="M8 9.2V6.3M6.4 1.6h3.2M12.3 4.2l1-1" strokeLinecap="round" />
      </svg>
      DELAY
    </span>
  );
}

/** 수식어: 히트 상황은 리본 배지, delay 는 딜레이 배지 */
function Modifiers({ modifiers }: { modifiers: Modifier[] }) {
  if (modifiers.length === 0) return null;
  return (
    <>
      {modifiers.map((m) => (isSituation(m) ? <SituationBadge key={m} situation={m} /> : <DelayBadge key={m} />))}
      <span className="w-0.5" />
    </>
  );
}

function MoveIcons({ move }: { move: Move }) {
  switch (move.kind) {
    case "note":
      return <span className="text-sm text-muted">({move.text})</span>;
    case "unknown":
      return <span className="rounded bg-warn/15 px-1 font-mono text-sm text-warn">{move.text}</span>;
    case "system":
      return (
        <span className="inline-flex items-center gap-1">
          <Modifiers modifiers={move.modifiers} />
          <Icon icon={SYSTEM_ICONS[move.value]} />
        </span>
      );
    case "throw": {
      const label = move.direction === "f" ? "f.throw" : move.direction === "b" ? "b.throw" : "throw";
      return (
        <span className="inline-flex items-center gap-0.5" title={label}>
          <Modifiers modifiers={move.modifiers} />
          {move.direction && <Icon icon={directionIcons(move.direction === "f" ? "6" : "4")[0]} />}
          <span className="notation-throw" aria-label={label}>
            THROW
          </span>
        </span>
      );
    }
    case "input":
      return (
        <span className="inline-flex items-center gap-0.5">
          <Modifiers modifiers={move.modifiers} />
          {move.direction && directionIcons(move.direction).map((icon, i) => <Icon key={`d${i}`} icon={icon} />)}
          {move.buttons.map((b, i) => (
            <Icon key={`b${i}`} icon={BUTTON_ICONS[b]} />
          ))}
          {move.hits && (
            <span className="self-end text-xs font-bold text-muted" title={`${move.hits} hit`}>
              ({move.hits})
            </span>
          )}
        </span>
      );
  }
}

/** 한 줄의 콤보 표기를 이미지로 */
export function NotationImage({ notation }: { notation: string }) {
  const combo = parseNotation(notation);
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-2">
      {combo.map((step, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="text-muted" aria-label="then">→</span>}
          <span className="inline-flex items-center gap-1">
            {step.map((move, j) => (
              <Fragment key={j}>
                {/* 타겟 콤보 구분점. 괄호 메모 앞뒤에는 찍지 않는다 */}
                {j > 0 && move.kind !== "note" && step[j - 1].kind !== "note" && (
                  <span className="font-bold text-muted">·</span>
                )}
                <MoveIcons move={move} />
              </Fragment>
            ))}
          </span>
        </Fragment>
      ))}
    </span>
  );
}

export function NotationText({ notation }: { notation: string }) {
  return <span className="font-mono text-[0.95rem] leading-relaxed break-words">{displayNotation(notation)}</span>;
}

/** 방문자 설정(텍스트/이미지)에 따라 둘 중 하나가 보인다. */
export function Notation({ notation }: { notation: string }) {
  return (
    <>
      <span className="show-if-image">
        <NotationImage notation={notation} />
      </span>
      <span className="show-if-text">
        <NotationText notation={notation} />
      </span>
    </>
  );
}

/**
 * 클래식/모던 표기를 방문자 설정에 따라 보여 준다.
 * 모던 표기가 없으면 어느 설정에서든 클래식 표기를 보여 주고 "클래식 전용" 배지를 붙인다.
 */
export function ControlNotation({
  classic,
  modern,
  classicOnlyLabel,
}: {
  classic: string;
  modern: string | null;
  classicOnlyLabel: string;
}) {
  if (!modern) {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <span className="show-if-modern border border-border-strong px-1.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
          {classicOnlyLabel}
        </span>
        <Notation notation={classic} />
      </div>
    );
  }
  return (
    <>
      <div className="show-if-classic">
        <Notation notation={classic} />
      </div>
      <div className="show-if-modern">
        <Notation notation={modern} />
      </div>
    </>
  );
}
