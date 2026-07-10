"""End-to-end demo build.

1. Generate a 5,000-MSME synthetic population (8 archetypes, latent-risk process)
2. Train the two-layer scorer, report held-out AUROC/KS
3. Score the eight named demo MSMEs
4. Produce reason codes, what-if tips, limits, Munshi memos, agent traces
5. Export web/src/data/demo.json + engine/artifacts/*

Run: uv run python scripts/build_demo.py [--live-memos]
"""

from __future__ import annotations

import argparse
import json
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore", message="X does not have valid feature names")

import duckdb
import numpy as np
import polars as pl

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from naadi.explain import reason_codes, sensitivity, stress_test, what_if  # noqa: E402
from naadi.features import DIM_META, extract_features, population_frame  # noqa: E402
from naadi.generate import MONTHS, generate_demo_msmes, generate_population  # noqa: E402
from naadi.limits import recommend                                   # noqa: E402
from naadi.munshi import agent_trace, fact_sheet, polish_memo, render_memo  # noqa: E402
from naadi.scoring import NaadiScorer                                 # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
WEB_DATA = ROOT.parent / "web" / "src" / "data"
ARTIFACTS = ROOT / "artifacts"

# anchor: Jul 2024 .. Jun 2026
MONTH_LABELS = (
    [f"{m} '24" for m in ("Jul", "Aug", "Sep", "Oct", "Nov", "Dec")]
    + [f"{m} '25" for m in ("Jan", "Feb", "Mar", "Apr", "May", "Jun",
                            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")]
    + [f"{m} '26" for m in ("Jan", "Feb", "Mar", "Apr", "May", "Jun")]
)


def red_flags(f: dict, rec: dict) -> list[str]:
    flags = []
    if f["bounce_count"] > 0:
        flags.append(f"{int(f['bounce_count'])} EMI/NACH bounce(s) in the last 12 months")
    if f["filing_delay_mean"] > 5:
        flags.append(f"GSTR-3B filed late by {f['filing_delay_mean']:.0f} days on average")
    if f["top_payer_share"] > 0.5:
        flags.append(f"Top payer concentration at {f['top_payer_share']:.0%}")
    if f["eod_negative_days"] > 5:
        flags.append(f"{int(f['eod_negative_days'])} end-of-day negative balance days")
    if f["turnover_slope_6m"] < -0.01:
        flags.append(f"Turnover declining {abs(f['turnover_slope_6m']):.1%}/month over 6 months")
    return flags


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--live-memos", action="store_true",
                    help="Polish memos via Claude (needs ANTHROPIC_API_KEY)")
    ap.add_argument("--population", type=int, default=5000)
    args = ap.parse_args()

    print("[1/5] Generating synthetic population...")
    pop = generate_population(args.population)
    df = population_frame(pop)

    print("[2/5] Training two-layer scorer (6 dimension scorecards + composite)...")
    scorer = NaadiScorer()
    metrics = scorer.fit(df)
    print(f"      default rate {metrics['default_rate']:.1%} | "
          f"held-out AUROC {metrics['auroc_test']:.3f} | KS {metrics['ks_test']:.3f}")

    print("[3/5] Scoring the eight demo MSMEs...")
    msmes = []
    for rec_raw in generate_demo_msmes():
        f = extract_features(rec_raw)
        sc = scorer.score(f, rec_raw["tier"])
        reasons = reason_codes(scorer, f)
        tips = what_if(scorer, f, rec_raw["tier"], sc["score"])
        stress = stress_test(scorer, f, rec_raw["tier"], sc["score"])
        monthly_turnover = float(np.mean(rec_raw["turnover"][-6:]))

        # Rolling rescore: "what would NAADI have said each month?" — the
        # portfolio-radar view. Series features recompute on each window;
        # point-in-time scalars carry.
        history = []
        for k in range(13, MONTHS + 1):
            rec_k = {
                **rec_raw,
                "turnover": rec_raw["turnover"][:k],
                "upi_inflow": rec_raw["upi_inflow"][:k],
                "balance_series": rec_raw["balance_series"][:k],
                "filing_delay": rec_raw["filing_delay"][:k],
                "upi_txn_count": rec_raw["upi_txn_count"][:k],
            }
            fk = extract_features(rec_k)
            history.append({
                "month": MONTH_LABELS[k - 1],
                "score": scorer.score(fk, rec_raw["tier"])["score"],
            })
        recommendation = recommend(
            sc["grade"], f,
            monthly_inflow=monthly_turnover,
            monthly_outflow=rec_raw["monthly_outflow"],
            existing_emi=rec_raw["existing_emi"],
        )
        m = {
            "id": rec_raw["id"],
            "name": rec_raw["name"],
            "city": rec_raw["city"],
            "state": rec_raw["state"],
            "sector": rec_raw["sector"],
            "archetype": rec_raw["archetype_label"],
            "vintage_years": rec_raw["vintage_years"],
            "proprietor": rec_raw["proprietor"],
            "story": rec_raw["story"],
            "tier": rec_raw["tier"],
            "headcount": rec_raw["headcount"],
            "monthly_turnover": round(monthly_turnover),
            "scoring": sc,
            "reasons": reasons,
            "what_if": tips,
            "stress": stress,
            "sensitivity": sensitivity(scorer, f, rec_raw["tier"]),
            "score_history": history,
            "benchmark": {
                "overall": round(scorer.percentile(sc["score"]), 3),
                "sector": round(scorer.percentile(sc["score"], rec_raw["sector"]), 3),
                "sector_name": rec_raw["sector"],
            },
            "recommendation": recommendation,
            "red_flags": red_flags(f, recommendation),
            "features": {k: round(float(v), 4) for k, v in f.items()},
            "series": {
                "months": MONTH_LABELS,
                "turnover": [round(float(v)) for v in rec_raw["turnover"]],
                "upi_inflow": [round(float(v)) for v in rec_raw["upi_inflow"]],
                "balance": [round(float(v)) for v in rec_raw["balance_series"]],
                "upi_txn_count": [int(v) for v in rec_raw["upi_txn_count"]],
            },
        }
        m["memo"] = render_memo(fact_sheet(m))
        if args.live_memos:
            m["memo"] = polish_memo(fact_sheet(m), m["memo"])
        m["trace"] = agent_trace(m)
        msmes.append(m)
        print(f"      {m['id']} {m['name']:<34} -> {sc['score']} ± {sc['band']} "
              f"({sc['grade']}) PD {sc['pd_12m']:.1%} {recommendation['decision']}")

    print("[4/5] Portfolio aggregates (DuckDB)...")
    flat = pl.DataFrame([{
        "id": m["id"], "name": m["name"], "grade": m["scoring"]["grade"],
        "score": m["scoring"]["score"], "pd": m["scoring"]["pd_12m"],
        "limit_inr": m["recommendation"]["limit"],
        "decision": m["recommendation"]["decision"],
        "turnover": m["monthly_turnover"], "tier": m["tier"],
    } for m in msmes])
    con = duckdb.connect()
    con.register("book", flat)  # duckdb scans polars frames natively
    agg = con.sql("""
        SELECT count(*)                          AS n,
               round(avg(score))                 AS avg_score,
               round(avg(pd) * 100, 2)           AS avg_pd_pct,
               sum(limit_inr)                    AS total_recommended_limit,
               sum(CASE WHEN decision = 'APPROVE' THEN 1 ELSE 0 END)  AS approvals,
               sum(CASE WHEN decision = 'REFER' THEN 1 ELSE 0 END)    AS referrals
        FROM book
    """).fetchone()
    grade_dist = {g: int(c) for g, c in con.sql(
        "SELECT grade, count(*) FROM book GROUP BY grade ORDER BY grade").fetchall()}

    # rule-based portfolio radar: what should the RM look at this morning?
    alerts = []
    for m in msmes:
        hist = [p["score"] for p in m["score_history"]]
        f, sev = m["features"], None
        if hist[-1] < 580:
            alerts.append({"id": m["id"], "name": m["name"], "severity": "red",
                           "text": f"Below EWS threshold — {hist[-1]} today, "
                                   f"{sum(1 for s in hist if s < 580)} of last 12 months under the line"})
        elif hist[-1] - hist[0] <= -15:
            alerts.append({"id": m["id"], "name": m["name"], "severity": "amber",
                           "text": f"Score deteriorating: {hist[0]} → {hist[-1]} over 12 months"})
        if f["bounce_count"] > 0:
            alerts.append({"id": m["id"], "name": m["name"], "severity": "amber",
                           "text": f"{int(f['bounce_count'])} EMI/NACH bounce(s) on the wire"})
        if f["filing_delay_mean"] > 5:
            alerts.append({"id": m["id"], "name": m["name"], "severity": "amber",
                           "text": f"GSTR-3B late by {f['filing_delay_mean']:.0f} days on average"})
        if f["top_payer_share"] > 0.5:
            alerts.append({"id": m["id"], "name": m["name"], "severity": "watch",
                           "text": f"Top payer at {f['top_payer_share']:.0%} of revenue"})
    sev_rank = {"red": 0, "amber": 1, "watch": 2}
    alerts.sort(key=lambda a: sev_rank[a["severity"]])

    payload = {
        "generated_for": "IDBI Innovate 2026 · Track 03 · concept build (synthetic data)",
        "validation": metrics,
        "dimensions": {d: {"label": lbl, "question": q} for d, (lbl, q) in DIM_META.items()},
        "portfolio": {
            "n": int(agg[0]), "avg_score": int(agg[1]), "avg_pd_pct": float(agg[2]),
            "total_recommended_limit": int(agg[3]),
            "approvals": int(agg[4]), "referrals": int(agg[5]),
            "grade_distribution": grade_dist,
            "alerts": alerts[:7],
        },
        "msmes": msmes,
    }

    print("[5/5] Writing artifacts...")
    WEB_DATA.mkdir(parents=True, exist_ok=True)
    out = WEB_DATA / "demo.json"
    out.write_text(json.dumps(payload, indent=1), encoding="utf-8")
    scorer.save(ARTIFACTS / "naadi_scorer.pkl")
    print(f"      {out}  ({out.stat().st_size / 1024:.0f} KB)")
    print(f"      {ARTIFACTS / 'naadi_scorer.pkl'}")
    print(f"      {ARTIFACTS / 'validation.json'}")
    print("Done.")


if __name__ == "__main__":
    main()
