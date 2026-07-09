import Link from "next/link";
import { DecisionChip, GradeChip } from "@/components/Chips";
import Header from "@/components/Header";
import Spark from "@/components/Spark";
import { demo } from "@/lib/data";
import { GRADE_COLOR, inr, pct } from "@/lib/format";

export default function Portfolio() {
  const { portfolio, validation, msmes } = demo;
  const grades = ["A+", "A", "B", "C", "D", "E"];

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl px-5 pb-20 flex-1">
        {/* hero */}
        <section className="pt-12 pb-8 rise">
          <p className="label-caps">MSME Financial Health · relationship-manager console</p>
          <h1
            className="mt-3 max-w-3xl text-4xl md:text-[3.4rem] leading-[1.05] font-medium"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Reading the <em className="text-pulse-300">financial pulse</em> of
            businesses the balance sheet never sees.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-sage leading-relaxed">
            GST · UPI · Account Aggregator · EPFO — fused into a six-dimension
            Health Card, an explainable score, and a finished underwriting memo.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="chip">
              validated on {(validation.n_train + validation.n_val + validation.n_test).toLocaleString("en-IN")} synthetic MSMEs
            </span>
            <span className="chip">held-out AUROC <b className="text-pulse-300 ml-1">{validation.auroc_test.toFixed(3)}</b></span>
            <span className="chip">KS <b className="text-pulse-300 ml-1">{validation.ks_test.toFixed(3)}</b></span>
            <span className="chip">{validation.n_features} features · 6 dimensions</span>
          </div>
        </section>

        {/* portfolio strip */}
        <section className="card p-5 rise rise-2">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
            {[
              ["On the desk", `${portfolio.n} files`],
              ["Average score", String(portfolio.avg_score)],
              ["Average PD (12m)", `${portfolio.avg_pd_pct}%`],
              ["Recommended exposure", inr(portfolio.total_recommended_limit)],
              ["Decisions", `${portfolio.approvals} approve · ${portfolio.referrals} refer`],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="label-caps">{k}</div>
                <div className="num mt-1.5 text-xl text-bone">{v}</div>
              </div>
            ))}
          </div>
          {/* grade distribution */}
          <div className="mt-5">
            <div className="flex h-2 overflow-hidden rounded-full">
              {grades.map((g) => {
                const n = portfolio.grade_distribution[g] ?? 0;
                if (!n) return null;
                return (
                  <div
                    key={g}
                    style={{
                      width: `${(n / portfolio.n) * 100}%`,
                      background: GRADE_COLOR[g],
                      opacity: 0.8,
                    }}
                    title={`${g}: ${n}`}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex gap-4">
              {grades.map((g) => {
                const n = portfolio.grade_distribution[g] ?? 0;
                if (!n) return null;
                return (
                  <span key={g} className="num text-[0.68rem] text-sage">
                    <span style={{ color: GRADE_COLOR[g] }}>■</span> {g} × {n}
                  </span>
                );
              })}
            </div>
          </div>
        </section>

        {/* book */}
        <section className="mt-8">
          <div className="flex items-baseline justify-between rise rise-3">
            <h2 className="label-caps">This morning’s book — click a file to open its Health Card</h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {msmes.map((m, i) => (
              <Link
                key={m.id}
                href={`/m/${m.id}`}
                className={`card group p-5 transition-all duration-300 hover:-translate-y-1 hover:border-pulse-500/40 rise rise-${Math.min((i % 3) + 3, 5)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3
                      className="truncate text-lg font-medium leading-tight group-hover:text-pulse-300 transition-colors"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {m.name}
                    </h3>
                    <p className="mt-0.5 text-[0.72rem] text-sage">
                      {m.sector} · {m.city} · {m.vintage_years} yrs · <span className="num">{m.tier}</span>
                    </p>
                  </div>
                  <GradeChip grade={m.scoring.grade} />
                </div>

                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <span
                      className="num text-3xl font-semibold"
                      style={{ fontFamily: "var(--font-display)", color: GRADE_COLOR[m.scoring.grade] }}
                    >
                      {m.scoring.score}
                    </span>
                    <span className="num text-[0.68rem] text-sage-dim ml-1.5">± {m.scoring.band}</span>
                  </div>
                  <div className="text-right">
                    <div className="label-caps">PD 12m</div>
                    <div className="num text-sm text-bone">{pct(m.scoring.pd_12m)}</div>
                  </div>
                </div>

                <div className="mt-3 -mx-1">
                  <Spark
                    values={m.series.turnover.slice(-12)}
                    months={m.series.months.slice(-12)}
                    height={44}
                    color={GRADE_COLOR[m.scoring.grade]}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between hairline-t pt-3">
                  <DecisionChip decision={m.recommendation.decision} />
                  <span className="num text-[0.68rem] text-sage">
                    {m.red_flags.length
                      ? `${m.red_flags.length} flag${m.red_flags.length > 1 ? "s" : ""}`
                      : "clean"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-14 hairline-t pt-5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[0.7rem] text-sage-dim">
            NAADI · IDBI Innovate 2026 · Track 03 — Financial Health Score · “Build. Integrate. Transform.”
          </span>
          <span className="num text-[0.65rem] text-sage-dim">
            every figure on this screen was computed by the engine on synthetic rails
          </span>
        </footer>
      </main>
    </>
  );
}
