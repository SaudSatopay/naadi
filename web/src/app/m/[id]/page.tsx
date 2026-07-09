import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DecisionChip, TierBadge } from "@/components/Chips";
import Header from "@/components/Header";
import MemoPanel from "@/components/MemoPanel";
import Radar6 from "@/components/Radar6";
import ReasonLedger from "@/components/ReasonLedger";
import ScoreDial from "@/components/ScoreDial";
import ScoreHistory from "@/components/ScoreHistory";
import Spark from "@/components/Spark";
import StressLab from "@/components/StressLab";
import TraceReplay from "@/components/TraceReplay";
import WhatIf from "@/components/WhatIf";
import { allMsmes, demo, msmeById } from "@/lib/data";
import { DECISION_STYLE, inr, inrFull, pct } from "@/lib/format";
import type { Dim } from "@/lib/types";

export function generateStaticParams() {
  return allMsmes().map((m) => ({ id: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const m = msmeById(id);
  if (!m) return { title: "NAADI" };
  return {
    title: `${m.name} · NAADI ${m.scoring.score} ${m.scoring.grade}`,
    description: m.story,
  };
}

const DIM_ORDER: Dim[] = ["L", "S", "G", "R", "C", "K"];

export default async function HealthCard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const m = msmeById(id);
  if (!m) notFound();

  const rec = m.recommendation;
  const decisionColor = DECISION_STYLE[rec.decision].color;
  const allReasons = [...m.reasons.positive, ...m.reasons.negative];
  const byDim = Object.fromEntries(allReasons.map((e) => [e.dimension, e]));

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl px-5 pb-20 flex-1">
        <nav className="pt-6 rise print:hidden">
          <Link href="/" className="chip hover:text-bone transition-colors">
            ← back to the book
          </Link>
        </nav>

        {/* identity + dial + decision */}
        <section className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_auto_1fr] print:hidden">
          <div className="card p-6 rise">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="chip">{m.id}</span>
              <TierBadge tier={m.tier} />
            </div>
            <h1
              className="mt-3 text-3xl md:text-4xl font-medium leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {m.name}
            </h1>
            <p className="mt-1 text-sm text-sage">
              {m.archetype} · {m.sector} · {m.city}, {m.state} · {m.vintage_years} yrs ·{" "}
              {m.headcount} on payroll
            </p>
            <p
              className="mt-4 text-[0.95rem] leading-relaxed text-bone/85 italic"
              style={{ fontFamily: "var(--font-display)" }}
            >
              “{m.story}”
            </p>
            <div className="mt-4 hairline-t pt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="label-caps">Proprietor</div>
                <div className="mt-1 text-sm">{m.proprietor}</div>
              </div>
              <div>
                <div className="label-caps">Monthly turnover (6-mo avg)</div>
                <div className="mt-1 num text-sm text-marigold-300">{inrFull(m.monthly_turnover)}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="chip">
                beats <b className="text-pulse-300 mx-1">{Math.round(m.benchmark.sector * 100)}%</b> of {m.benchmark.sector_name} peers
              </span>
              <span className="chip">
                <b className="text-pulse-300 mr-1">{Math.round(m.benchmark.overall * 100)}th</b> percentile, all MSMEs
              </span>
            </div>
            <div className="mt-5">
              <TraceReplay m={m} />
            </div>
          </div>

          <div className="card p-6 flex items-center justify-center rise rise-2 min-w-[340px]">
            <ScoreDial
              score={m.scoring.score}
              band={m.scoring.band}
              grade={m.scoring.grade}
              pd={m.scoring.pd_12m}
            />
          </div>

          <div className="card p-6 rise rise-3" style={{ borderColor: `color-mix(in oklab, ${decisionColor} 30%, var(--color-ink-700))` }}>
            <div className="flex items-center justify-between">
              <div className="label-caps">Munshi recommends</div>
              <DecisionChip decision={rec.decision} />
            </div>
            {rec.limit > 0 ? (
              <>
                <div
                  className="num mt-3 text-4xl font-semibold"
                  style={{ fontFamily: "var(--font-display)", color: "var(--color-marigold-300)" }}
                >
                  {inr(rec.limit)}
                </div>
                <div className="text-[0.72rem] text-sage mt-0.5">working-capital line · {inrFull(rec.limit)}</div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    ["Tenor", `${rec.tenor_months} mo`],
                    ["Rate", pct(rec.indicative_rate)],
                    ["EMI room", inr(rec.serviceable_emi)],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-ink-700 bg-ink-900/60 px-2.5 py-2">
                      <div className="label-caps">{k}</div>
                      <div className="num mt-0.5 text-sm">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-[0.72rem] text-sage">
                  verified monthly surplus <span className="num text-bone">{inrFull(rec.monthly_surplus)}</span>
                </div>
              </>
            ) : (
              <div className="mt-3 text-sm text-sage leading-relaxed">
                No exposure recommended today — the what-if panel below hands the
                borrower a concrete path back.
              </div>
            )}
            {rec.guards.length > 0 && (
              <div className="mt-4 hairline-t pt-3 grid gap-1.5">
                {rec.guards.map((g) => (
                  <div key={g} className="text-[0.72rem] text-marigold-300/90 leading-snug">⚖ {g}</div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* six dimensions */}
        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr] print:hidden">
          <div className="card p-5 rise rise-2">
            <h3 className="label-caps">The NAADI six — dimension radar</h3>
            <Radar6 scoring={m.scoring} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 rise rise-3">
            {DIM_ORDER.map((d) => {
              const meta = demo.dimensions[d];
              const sub = m.scoring.subscores[d];
              const entry = byDim[d];
              const good = (entry?.points ?? 0) > 0;
              return (
                <div key={d} className="card p-4 flex flex-col">
                  <div className="flex items-baseline justify-between">
                    <span className="label-caps">{d} · {meta.label}</span>
                    {entry && (
                      <span
                        className="num text-[0.68rem] font-semibold"
                        style={{ color: good ? "var(--color-pulse-400)" : "var(--color-verm-400)" }}
                      >
                        {good ? "+" : ""}{entry.points.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="num mt-2 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                    {sub.toFixed(0)}
                    <span className="text-[0.6em] text-sage-dim font-normal"> /100</span>
                  </div>
                  <div className="mt-2 h-[3px] rounded-full bg-ink-700 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${sub}%`,
                        background: sub >= 60 ? "var(--color-pulse-400)" : sub >= 35 ? "var(--color-marigold-400)" : "var(--color-verm-400)",
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[0.66rem] leading-snug text-sage-dim">{meta.question}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* score trajectory — the portfolio-radar money shot */}
        <section className="mt-4 rise rise-2 print:hidden">
          <ScoreHistory history={m.score_history} grade={m.scoring.grade} />
        </section>

        {/* rails / trends */}
        <section className="mt-4 grid gap-4 md:grid-cols-3 rise rise-3 print:hidden">
          {[
            { t: "GST turnover · 24 mo", v: m.series.turnover, c: "var(--color-pulse-400)" },
            { t: "UPI inflow · 24 mo", v: m.series.upi_inflow, c: "var(--color-marigold-400)" },
            { t: "Account balance · 24 mo", v: m.series.balance, c: "#7cc7f0" },
          ].map((s) => (
            <div key={s.t} className="card p-4">
              <div className="flex items-baseline justify-between">
                <h3 className="label-caps">{s.t}</h3>
                <span className="num text-[0.7rem]" style={{ color: s.c }}>
                  {inr(s.v[s.v.length - 1])}
                </span>
              </div>
              <div className="mt-2 -mx-1">
                <Spark values={s.v} months={m.series.months} color={s.c} height={72} />
              </div>
            </div>
          ))}
        </section>

        {/* reasons + right rail */}
        <section className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr] print:hidden">
          <div className="rise rise-2">
            <ReasonLedger positive={m.reasons.positive} negative={m.reasons.negative} />
          </div>
          <div className="grid gap-4 content-start rise rise-3">
            {m.red_flags.length > 0 && (
              <div className="card p-5" style={{ borderColor: "rgba(240,86,74,.3)" }}>
                <h3 className="label-caps" style={{ color: "var(--color-verm-300)" }}>
                  Red flags on the wire
                </h3>
                <ul className="mt-2 grid gap-1.5">
                  {m.red_flags.map((f) => (
                    <li key={f} className="text-[0.8rem] text-bone/85 leading-snug flex gap-2">
                      <span className="text-verm-400 shrink-0">▲</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <StressLab m={m} />
            <WhatIf m={m} />
            <div className="card p-5">
              <h3 className="label-caps">Early-warning triggers armed</h3>
              <ul className="mt-2 grid gap-1.5">
                {rec.early_warning.map((t) => (
                  <li key={t} className="text-[0.78rem] text-sage leading-snug flex gap-2">
                    <span className="text-pulse-400 shrink-0 blip">●</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* memo */}
        <section className="mt-4 rise rise-2">
          <MemoPanel memo={m.memo} />
        </section>
      </main>
    </>
  );
}
