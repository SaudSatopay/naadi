"use client";

/** Side-by-side underwriting: two files, one radar. */

import Link from "next/link";
import { useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DecisionChip, GradeChip } from "@/components/Chips";
import Header from "@/components/Header";
import { allMsmes, demo } from "@/lib/data";
import { GRADE_COLOR, inr, pct } from "@/lib/format";
import type { Dim } from "@/lib/types";

const ORDER: Dim[] = ["L", "S", "G", "R", "C", "K"];
const COLOR_A = "var(--color-pulse-400)";
const COLOR_B = "#7cc7f0";

function Picker({
  value,
  onChange,
  color,
  exclude,
}: {
  value: string;
  onChange: (id: string) => void;
  color: string;
  exclude: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm outline-none cursor-pointer"
      style={{ color, fontFamily: "var(--font-display)" }}
    >
      {allMsmes().map((m) => (
        <option key={m.id} value={m.id} disabled={m.id === exclude}>
          {m.name} — {m.scoring.score} {m.scoring.grade}
        </option>
      ))}
    </select>
  );
}

export default function Compare() {
  const msmes = allMsmes();
  const [aId, setAId] = useState(msmes[0].id);
  const [bId, setBId] = useState(msmes[2]?.id ?? msmes[1].id);
  const a = msmes.find((m) => m.id === aId)!;
  const b = msmes.find((m) => m.id === bId)!;

  const radarData = ORDER.map((d) => ({
    dim: `${d} · ${demo.dimensions[d].label}`,
    A: a.scoring.subscores[d],
    B: b.scoring.subscores[d],
  }));

  const stats: [string, (m: typeof a) => React.ReactNode][] = [
    ["Score", (m) => (
      <span className="num font-semibold" style={{ color: GRADE_COLOR[m.scoring.grade] }}>
        {m.scoring.score} ± {m.scoring.band}
      </span>
    )],
    ["Grade", (m) => <GradeChip grade={m.scoring.grade} />],
    ["PD 12m", (m) => <span className="num">{pct(m.scoring.pd_12m)}</span>],
    ["Decision", (m) => <DecisionChip decision={m.recommendation.decision} />],
    ["Limit", (m) => <span className="num text-marigold-300">{m.recommendation.limit ? inr(m.recommendation.limit) : "—"}</span>],
    ["Sector percentile", (m) => <span className="num">{Math.round(m.benchmark.sector * 100)}th</span>],
    ["Red flags", (m) => <span className="num">{m.red_flags.length || "clean"}</span>],
  ];

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl px-5 pb-20 flex-1">
        <nav className="pt-6 flex items-center justify-between rise">
          <Link href="/" className="chip hover:text-bone transition-colors">← back to the book</Link>
          <span className="label-caps">compare — two files, one radar</span>
        </nav>

        <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.2fr_1fr] items-start">
          <div className="card p-5 rise">
            <div className="label-caps mb-2" style={{ color: COLOR_A }}>file a</div>
            <Picker value={aId} onChange={setAId} color={COLOR_A} exclude={bId} />
            <p className="mt-3 text-[0.74rem] text-sage leading-snug">{a.sector} · {a.city} · {a.tier} · {a.vintage_years} yrs</p>
            <p className="mt-2 text-[0.8rem] italic text-bone/80 leading-snug" style={{ fontFamily: "var(--font-display)" }}>
              “{a.story.split(".")[0]}.”
            </p>
          </div>

          <div className="card p-4 rise rise-2">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="var(--color-ink-600)" />
                <PolarAngleAxis dataKey="dim" tick={{ fill: "var(--color-sage)", fontSize: 10, fontFamily: "var(--font-ledger)" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name={a.name} dataKey="A" stroke={COLOR_A} strokeWidth={2} fill={COLOR_A} fillOpacity={0.16} />
                <Radar name={b.name} dataKey="B" stroke={COLOR_B} strokeWidth={2} fill={COLOR_B} fillOpacity={0.16} />
                <Legend wrapperStyle={{ fontSize: 10, fontFamily: "var(--font-ledger)" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5 rise">
            <div className="label-caps mb-2" style={{ color: COLOR_B }}>file b</div>
            <Picker value={bId} onChange={setBId} color={COLOR_B} exclude={aId} />
            <p className="mt-3 text-[0.74rem] text-sage leading-snug">{b.sector} · {b.city} · {b.tier} · {b.vintage_years} yrs</p>
            <p className="mt-2 text-[0.8rem] italic text-bone/80 leading-snug" style={{ fontFamily: "var(--font-display)" }}>
              “{b.story.split(".")[0]}.”
            </p>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2 rise rise-3">
          <div className="card p-5">
            <h3 className="label-caps">Head to head</h3>
            <div className="mt-2">
              {stats.map(([label, render]) => (
                <div key={label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-2 hairline-t first:border-t-0">
                  <div className="text-right">{render(a)}</div>
                  <div className="label-caps text-center min-w-[7rem]">{label}</div>
                  <div>{render(b)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="label-caps">Dimension deltas — A vs B</h3>
            <div className="mt-2 grid gap-2">
              {ORDER.map((d) => {
                const va = a.scoring.subscores[d];
                const vb = b.scoring.subscores[d];
                const diff = va - vb;
                return (
                  <div key={d} className="grid grid-cols-[9rem_1fr_auto] items-center gap-3">
                    <span className="text-[0.72rem] text-sage">{d} · {demo.dimensions[d].label}</span>
                    <div className="relative h-2 rounded-full bg-ink-800/80 overflow-hidden">
                      <div className="absolute inset-y-0" style={{ left: 0, width: `${va}%`, background: COLOR_A, opacity: 0.65 }} />
                      <div className="absolute inset-y-0 border-t-2" style={{ left: 0, width: `${vb}%`, borderColor: COLOR_B, top: "70%" }} />
                    </div>
                    <span className="num text-[0.72rem] min-w-[4.5rem] text-right"
                      style={{ color: diff >= 0 ? COLOR_A : COLOR_B }}>
                      {diff >= 0 ? "A +" : "B +"}{Math.abs(diff).toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[0.66rem] text-sage-dim leading-snug">
              Same brain, same yardstick — the radar shows <i>why</i> two businesses with similar turnover deserve different answers.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
