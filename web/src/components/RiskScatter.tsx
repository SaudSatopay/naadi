"use client";

/** The risk officer's map: every file positioned by score vs PD,
 *  bubble sized by recommended exposure. Click a bubble to open the file. */

import { useRouter } from "next/navigation";
import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  Scatter,
  ScatterChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { allMsmes } from "@/lib/data";
import { GRADE_COLOR, inr } from "@/lib/format";

export default function RiskScatter() {
  const router = useRouter();
  const data = allMsmes().map((m) => ({
    id: m.id,
    name: m.name,
    score: m.scoring.score,
    pd: Math.max(m.scoring.pd_12m * 100, 0.05),
    limit: Math.max(m.recommendation.limit, 60_000),
    grade: m.scoring.grade,
    decision: m.recommendation.decision,
  }));

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="label-caps">The book, mapped — score vs PD, sized by exposure</h3>
        <span className="text-[0.62rem] num text-sage-dim">click a bubble to open the file</span>
      </div>
      <div className="-mx-2 mt-1">
        <ResponsiveContainer width="100%" height={230}>
          <ScatterChart margin={{ top: 12, right: 16, bottom: 2, left: -14 }}>
            <CartesianGrid stroke="var(--color-ink-700)" strokeDasharray="2 6" />
            <XAxis
              type="number"
              dataKey="score"
              domain={[400, 860]}
              tick={{ fill: "var(--color-sage-dim)", fontSize: 9, fontFamily: "var(--font-ledger)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-ink-600)" }}
              label={{ value: "NAADI score →", position: "insideBottomRight", fill: "var(--color-sage-dim)", fontSize: 9, fontFamily: "var(--font-ledger)", dy: -4 }}
            />
            <YAxis
              type="number"
              dataKey="pd"
              scale="log"
              domain={[0.04, 100]}
              tick={{ fill: "var(--color-sage-dim)", fontSize: 9, fontFamily: "var(--font-ledger)" }}
              tickFormatter={(v: number) => `${v}%`}
              ticks={[0.1, 1, 10, 100]}
              tickLine={false}
              axisLine={false}
              width={44}
              label={{ value: "PD 12m (log)", angle: -90, position: "insideLeft", fill: "var(--color-sage-dim)", fontSize: 9, fontFamily: "var(--font-ledger)", dx: 18 }}
            />
            <ZAxis type="number" dataKey="limit" range={[80, 520]} />
            <ReferenceLine
              x={580}
              stroke="var(--color-verm-400)"
              strokeDasharray="5 4"
              strokeOpacity={0.55}
              label={{ value: "EWS 580", fill: "var(--color-verm-300)", fontSize: 9, fontFamily: "var(--font-ledger)", position: "insideTopLeft" }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: "var(--color-ink-600)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as (typeof data)[number];
                return (
                  <div className="card px-3 py-2 text-[0.72rem]">
                    <div style={{ fontFamily: "var(--font-display)" }}>{p.name}</div>
                    <div className="num text-sage mt-0.5">
                      <span style={{ color: GRADE_COLOR[p.grade] }}>{p.score} {p.grade}</span> · PD {p.pd.toFixed(1)}% · {inr(p.limit)}
                    </div>
                  </div>
                );
              }}
            />
            <Scatter data={data} onClick={(d) => router.push(`/m/${(d as unknown as { id: string }).id}`)} cursor="pointer">
              {data.map((d) => (
                <Cell key={d.id} fill={GRADE_COLOR[d.grade]} fillOpacity={0.75} stroke={GRADE_COLOR[d.grade]} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
