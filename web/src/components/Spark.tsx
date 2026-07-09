"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { inr } from "@/lib/format";

export default function Spark({
  values,
  months,
  color = "var(--color-pulse-400)",
  height = 56,
  money = true,
}: {
  values: number[];
  months?: string[];
  color?: string;
  height?: number;
  money?: boolean;
}) {
  const gid = useId().replace(/:/g, "");
  const data = values.map((v, i) => ({ i, v, m: months?.[i] ?? `${i + 1}` }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          cursor={{ stroke: "var(--color-ink-600)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as { v: number; m: string };
            return (
              <div className="card px-2.5 py-1.5 text-[0.7rem] num">
                <div className="text-sage">{p.m}</div>
                <div style={{ color }}>{money ? inr(p.v) : p.v.toLocaleString("en-IN")}</div>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.8}
          fill={`url(#${gid})`}
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
