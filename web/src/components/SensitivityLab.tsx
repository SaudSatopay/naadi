"use client";

/** Drag a lever, watch the score move — 1-D partial dependence curves
 *  precomputed through the trained brain. One lever at a time, honestly. */

import { useMemo, useState } from "react";
import type { Msme } from "@/lib/types";
import { GRADE_COLOR } from "@/lib/format";

const ORDER = ["filing_delay_mean", "bounce_count", "top_payer_share", "cash_buffer_days"];

function interp(points: { x: number; score: number }[], x: number): number {
  if (x <= points[0].x) return points[0].score;
  for (let i = 1; i < points.length; i++) {
    if (x <= points[i].x) {
      const a = points[i - 1];
      const b = points[i];
      const t = (x - a.x) / (b.x - a.x || 1);
      return Math.round(a.score + t * (b.score - a.score));
    }
  }
  return points[points.length - 1].score;
}

function fmt(v: number, unit: string): string {
  if (unit === "%") return `${Math.round(v * 100)}%`;
  return `${Math.round(v * 10) / 10} ${unit}`;
}

export default function SensitivityLab({ m }: { m: Msme }) {
  const levers = useMemo(
    () => ORDER.filter((k) => m.sensitivity?.[k]).map((k) => ({ key: k, ...m.sensitivity[k] })),
    [m.sensitivity]
  );
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(levers.map((l) => [l.key, l.current]))
  );
  const [active, setActive] = useState<string | null>(null);

  if (!levers.length) return null;

  const activeLever = levers.find((l) => l.key === active);
  const projected = activeLever ? interp(activeLever.points, values[activeLever.key]) : m.scoring.score;
  const delta = projected - m.scoring.score;
  const deltaColor =
    delta > 0 ? "var(--color-pulse-400)" : delta < 0 ? "var(--color-verm-400)" : "var(--color-sage)";

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="label-caps">Sensitivity lab — drag a lever, the brain answers</h3>
        <span className="text-[0.62rem] num text-sage-dim">
          1-D partial dependence · precomputed through the trained model · one lever at a time
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] items-center">
        <div className="grid gap-3.5">
          {levers.map((l) => {
            const min = l.points[0].x;
            const max = l.points[l.points.length - 1].x;
            const v = values[l.key];
            const isActive = active === l.key;
            return (
              <div key={l.key}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[0.78rem]" style={{ color: isActive ? "var(--color-bone)" : "var(--color-sage)" }}>
                    {l.label}
                  </span>
                  <span className="num text-[0.72rem]" style={{ color: isActive ? "var(--color-pulse-300)" : "var(--color-sage-dim)" }}>
                    {fmt(v, l.unit)}
                    {Math.abs(v - l.current) > 1e-9 && (
                      <span className="text-sage-dim"> · today {fmt(l.current, l.unit)}</span>
                    )}
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={(max - min) / 100}
                  value={v}
                  onChange={(e) => {
                    setActive(l.key);
                    setValues((s) => ({ ...s, [l.key]: Number(e.target.value) }));
                  }}
                  className="w-full mt-1.5 h-1 cursor-pointer"
                  style={{ accentColor: "var(--color-pulse-400)" }}
                />
              </div>
            );
          })}
        </div>

        <div className="text-center px-6 py-3 rounded-xl border border-ink-700 bg-ink-900/70 min-w-[11rem]">
          <div className="label-caps">{activeLever ? "projected score" : "current score"}</div>
          <div
            className="num text-5xl font-semibold mt-1"
            style={{
              fontFamily: "var(--font-display)",
              color: activeLever ? deltaColor : GRADE_COLOR[m.scoring.grade],
            }}
          >
            {projected}
          </div>
          <div className="num text-[0.72rem] mt-1" style={{ color: deltaColor }}>
            {activeLever
              ? `${delta > 0 ? "+" : ""}${delta} vs today's ${m.scoring.score}`
              : "touch a lever to project"}
          </div>
          {activeLever && (
            <button
              onClick={() => {
                setValues(Object.fromEntries(levers.map((l) => [l.key, l.current])));
                setActive(null);
              }}
              className="chip mt-2.5 hover:text-bone transition-colors"
            >
              reset to today
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
