import type { Msme } from "@/lib/types";

/** Score, assembled: base anchor + six signed dimension contributions
 *  (TreeSHAP, converted to score points) stacking up to the final number. */
export default function Waterfall({ m }: { m: Msme }) {
  const entries = [...m.reasons.positive, ...m.reasons.negative];
  const total = entries.reduce((a, e) => a + e.points, 0);
  const base = m.scoring.score - total;

  const LO = 300;
  const HI = 900;
  const pos = (v: number) => `${((v - LO) / (HI - LO)) * 100}%`;
  const width = (a: number, b: number) => `${(Math.abs(b - a) / (HI - LO)) * 100}%`;

  let running = base;
  const rows = entries.map((e) => {
    const from = running;
    running += e.points;
    return { ...e, from, to: running };
  });

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="label-caps">Score, assembled — the waterfall</h3>
        <span className="text-[0.62rem] num text-sage-dim">
          base {Math.round(base)} + six dimensions = {m.scoring.score}
        </span>
      </div>
      <div className="mt-3 grid gap-1.5">
        <div className="grid grid-cols-[7rem_1fr_3.2rem] items-center gap-3">
          <span className="text-[0.7rem] text-sage-dim">Peer base</span>
          <div className="relative h-3 rounded bg-ink-800/70 overflow-hidden">
            <div
              className="absolute inset-y-0 rounded-r"
              style={{ left: 0, width: pos(base), background: "var(--color-ink-600)" }}
            />
          </div>
          <span className="num text-[0.7rem] text-sage text-right">{Math.round(base)}</span>
        </div>
        {rows.map((r) => {
          const up = r.points >= 0;
          const color = up ? "var(--color-pulse-400)" : "var(--color-verm-400)";
          return (
            <div key={r.code} className="grid grid-cols-[7rem_1fr_3.2rem] items-center gap-3">
              <span className="text-[0.7rem] text-sage truncate">{r.dimension_label}</span>
              <div className="relative h-3 rounded bg-ink-800/70">
                <div
                  className="absolute inset-y-0 rounded"
                  style={{
                    left: pos(Math.min(r.from, r.to)),
                    width: width(r.from, r.to),
                    background: color,
                    opacity: 0.85,
                  }}
                />
              </div>
              <span className="num text-[0.7rem] text-right" style={{ color }}>
                {up ? "+" : ""}
                {r.points.toFixed(0)}
              </span>
            </div>
          );
        })}
        <div className="grid grid-cols-[7rem_1fr_3.2rem] items-center gap-3">
          <span className="text-[0.7rem] font-medium text-bone">NAADI score</span>
          <div className="relative h-3">
            <div
              className="absolute -top-0.5 h-4 w-[2px] rounded"
              style={{ left: pos(m.scoring.score), background: "var(--color-bone)" }}
            />
            <div className="absolute inset-y-0 left-0 right-0 rounded bg-gradient-to-r from-transparent via-transparent to-transparent border-b border-dashed border-ink-600" />
          </div>
          <span className="num text-[0.78rem] font-semibold text-bone text-right">{m.scoring.score}</span>
        </div>
      </div>
    </div>
  );
}
