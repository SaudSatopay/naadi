import type { Msme } from "@/lib/types";
import { GRADE_COLOR } from "@/lib/format";

/** Adverse scenarios rescored through the same brain — the question every
 *  risk committee asks, answered before they ask it. */
export default function StressLab({ m }: { m: Msme }) {
  if (!m.stress?.length) return null;
  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="label-caps">Stress lab</h3>
        <span className="text-[0.62rem] num text-sage-dim">rescored, not guessed</span>
      </div>
      <div className="mt-3 grid gap-2">
        {m.stress.map((s) => (
          <div
            key={s.scenario}
            className="flex items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-900/60 px-3 py-2.5"
          >
            <span className="text-[0.78rem] text-bone/85 leading-snug">{s.scenario}</span>
            <span className="num text-sm shrink-0 text-right">
              <span style={{ color: GRADE_COLOR[s.grade] }}>{s.score} {s.grade}</span>
              <span
                className="ml-2 text-[0.72rem]"
                style={{ color: s.delta < 0 ? "var(--color-verm-400)" : "var(--color-sage)" }}
              >
                {s.delta === 0 ? "±0" : s.delta}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
