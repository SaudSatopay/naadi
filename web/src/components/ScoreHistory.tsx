"use client";

/** Rolling 12-month rescore: "what would NAADI have said each month?"
 *  This is the portfolio-radar view — deterioration is visible long before
 *  the default event. */

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GRADE_COLOR } from "@/lib/format";

const EWS = 580; // C/D boundary — early-warning threshold

export default function ScoreHistory({
  history,
  grade,
}: {
  history: { month: string; score: number }[];
  grade: string;
}) {
  const color = GRADE_COLOR[grade] ?? "var(--color-pulse-400)";
  const scores = history.map((h) => h.score);
  const lo = Math.min(...scores, EWS) - 30;
  const hi = Math.max(...scores, EWS) + 30; // threshold always in frame
  const delta = scores[scores.length - 1] - scores[0];
  const breached = scores.some((s) => s < EWS);

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="label-caps">Score trajectory — 12-month rolling rescore</h3>
        <div className="flex items-center gap-3">
          <span className="num text-[0.7rem]" style={{ color: delta >= 0 ? "var(--color-pulse-400)" : "var(--color-verm-400)" }}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)} pts over 12 mo
          </span>
          {breached && (
            <span className="chip" style={{ color: "var(--color-verm-300)", borderColor: "rgba(240,86,74,.4)" }}>
              EWS breached
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 -mx-2">
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={history} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="var(--color-ink-700)" strokeDasharray="2 6" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: "var(--color-sage-dim)", fontSize: 9, fontFamily: "var(--font-ledger)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-ink-600)" }}
              interval={1}
            />
            <YAxis
              domain={[lo, hi]}
              tick={{ fill: "var(--color-sage-dim)", fontSize: 9, fontFamily: "var(--font-ledger)" }}
              tickLine={false}
              axisLine={false}
              width={46}
            />
            <ReferenceLine
              y={EWS}
              stroke="var(--color-verm-400)"
              strokeDasharray="5 4"
              strokeOpacity={0.6}
              label={{
                value: "early-warning · 580",
                position: "insideBottomRight",
                fill: "var(--color-verm-300)",
                fontSize: 9,
                fontFamily: "var(--font-ledger)",
              }}
            />
            <Tooltip
              cursor={{ stroke: "var(--color-ink-600)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as { month: string; score: number };
                return (
                  <div className="card px-2.5 py-1.5 text-[0.7rem] num">
                    <div className="text-sage">{p.month}</div>
                    <div style={{ color }}>{p.score}</div>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke={color}
              strokeWidth={2.2}
              dot={{ r: 2.5, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              isAnimationActive
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[0.68rem] text-sage-dim">
        Each point is the score NAADI would have produced with only the data
        visible that month — deterioration surfaces quarters before a default.
      </p>
    </div>
  );
}
