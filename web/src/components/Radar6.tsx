"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { Dim, Scoring } from "@/lib/types";
import { demo } from "@/lib/data";

const ORDER: Dim[] = ["L", "S", "G", "R", "C", "K"];

export default function Radar6({ scoring }: { scoring: Scoring }) {
  const data = ORDER.map((d) => ({
    dim: `${d} · ${demo.dimensions[d].label}`,
    value: scoring.subscores[d],
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="var(--color-ink-600)" />
        <PolarAngleAxis
          dataKey="dim"
          tick={{ fill: "var(--color-sage)", fontSize: 10, fontFamily: "var(--font-ledger)" }}
        />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          dataKey="value"
          stroke="var(--color-pulse-400)"
          strokeWidth={2}
          fill="var(--color-pulse-400)"
          fillOpacity={0.18}
          isAnimationActive
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
