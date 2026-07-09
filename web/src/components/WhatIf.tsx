import type { Msme } from "@/lib/types";

export default function WhatIf({ m }: { m: Msme }) {
  if (!m.what_if.length) return null;
  return (
    <div className="card p-5">
      <h3 className="label-caps">What-if — the path to a better score</h3>
      <p className="mt-1 text-[0.72rem] text-sage-dim">
        Counterfactuals over actionable levers only. Shown to the borrower — a
        decline is never a dead end.
      </p>
      <div className="mt-3 grid gap-2">
        {m.what_if.map((t) => (
          <div
            key={t.action}
            className="flex items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-900/60 px-3 py-2.5 hover:border-pulse-500/40 transition-colors"
          >
            <span className="text-[0.8rem] text-bone/90 leading-snug">{t.action}</span>
            <span className="num text-sm font-semibold text-pulse-300 shrink-0">
              +{t.delta} pts → {t.new_score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
