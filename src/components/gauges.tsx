/**
 * SF6 게이지처럼 칸으로 나뉜 막대.
 * 드라이브 게이지는 6칸(0.5칸 단위 가능), SA 게이지는 3칸.
 */
export function SegmentGauge({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2" aria-label={`${label} ${value}/${max}`} role="img">
      <span className="eyebrow w-10 text-[0.7rem]!">{label}</span>
      <div className="flex gap-[3px]">
        {Array.from({ length: max }, (_, i) => {
          const fill = Math.max(0, Math.min(1, value - i));
          return (
            <span key={i} className="skew relative h-3 w-5 overflow-hidden bg-inset ring-1 ring-border">
              <span
                className="absolute inset-y-0 left-0 transform-none!"
                style={{ width: `${fill * 100}%`, background: color, boxShadow: fill ? `0 0 8px ${color}` : undefined }}
              />
            </span>
          );
        })}
      </div>
      <span className="display w-6 text-right text-base tabular-nums">{value}</span>
    </div>
  );
}
