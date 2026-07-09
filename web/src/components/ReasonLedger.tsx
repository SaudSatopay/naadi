import type { ReasonEntry } from "@/lib/types";

function Row({ e, max }: { e: ReasonEntry; max: number }) {
  const up = e.points > 0;
  const color = up ? "var(--color-pulse-400)" : "var(--color-verm-400)";
  const w = Math.max(6, (Math.abs(e.points) / max) * 100);
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-2.5 hairline-t first:border-t-0">
      <span className="chip !px-2 !py-0.5">{e.code}</span>
      <div className="min-w-0">
        <div className="text-[0.8rem] leading-snug text-bone/90">
          <span className="text-sage">{e.dimension_label} — </span>
          {e.text}
        </div>
        <div className="mt-1.5 h-[3px] rounded-full bg-ink-700 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${w}%`, background: color, opacity: 0.85 }}
          />
        </div>
      </div>
      <span className="num text-sm font-semibold shrink-0" style={{ color }}>
        {up ? "+" : ""}
        {e.points.toFixed(1)}
      </span>
    </div>
  );
}

export default function ReasonLedger({
  positive,
  negative,
}: {
  positive: ReasonEntry[];
  negative: ReasonEntry[];
}) {
  const max = Math.max(
    ...[...positive, ...negative].map((e) => Math.abs(e.points)),
    1
  );
  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="label-caps">Reason codes — why this score</h3>
        <span className="text-[0.65rem] num text-sage-dim">TreeSHAP · score points</span>
      </div>
      <div className="mt-3">
        {positive.map((e) => (
          <Row key={e.code} e={e} max={max} />
        ))}
        {negative.map((e) => (
          <Row key={e.code} e={e} max={max} />
        ))}
      </div>
    </div>
  );
}
