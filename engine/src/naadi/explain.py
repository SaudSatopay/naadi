"""Explainability: native TreeSHAP reason codes + actionable what-if engine.

SHAP values come straight from LightGBM's built-in TreeSHAP
(`pred_contrib=True`) — no external dependency. Contributions are converted
from log-odds into score points so every reason code reads as
"+/- N pts", and the same codes feed the officer memo, the MSME's
improvement tips, and adverse-action reporting.
"""

from __future__ import annotations

import numpy as np

from .features import DIM_META, DIMENSIONS, dim_features
from .scoring import NaadiScorer

# feature -> (plain-language template, value formatter)
_F = {
    "cash_buffer_days": ("cash buffer of {v:.0f} days of outflow", lambda v: v),
    "balance_to_outflow": ("average balance at {v:.0%} of monthly outflow", lambda v: v),
    "balance_p10_ratio": ("worst-decile balance at {v:.0%} of monthly outflow", lambda v: v),
    "eod_negative_days": ("{v:.0f} end-of-day negative balance days", lambda v: v),
    "turnover_cv": ("turnover volatility of {v:.0%}", lambda v: v),
    "upi_inflow_cv": ("UPI inflow volatility of {v:.0%}", lambda v: v),
    "worst_3mo_drawdown": ("worst 3-month revenue drawdown of {v:.0%}", lambda v: v),
    "seasonal_amplitude": ("seasonal swing of {v:.0%} around mean revenue", lambda v: v),
    "turnover_slope_6m": ("6-month turnover trend of {v:+.1%}/month", lambda v: v),
    "turnover_slope_12m": ("12-month turnover trend of {v:+.1%}/month", lambda v: v),
    "upi_txn_momentum": ("UPI transaction momentum of {v:+.1%}/month", lambda v: v),
    "new_payer_rate": ("new-customer acquisition at {v:.1%}/month", lambda v: v),
    "wage_growth": ("payroll wage growth of {v:+.1%}", lambda v: v),
    "bounce_count": ("{v:.0f} EMI/NACH bounce(s) in 12 months", lambda v: v),
    "bounce_rate": ("bounce frequency of {v:.1%} monthly", lambda v: v),
    "emi_coverage": ("surplus covering obligations {v:.1f}x", lambda v: v),
    "obligation_ratio": ("existing obligations at {v:.1%} of turnover", lambda v: v),
    "filing_delay_mean": ("average GSTR-3B filing delay of {v:.1f} days", lambda v: v),
    "filing_delay_max": ("worst GSTR-3B filing delay of {v:.0f} days", lambda v: v),
    "on_time_streak": ("{v:.0f} consecutive months of on-time GST filing", lambda v: v),
    "itc_mismatch": ("ITC mismatch rate of {v:.1%}", lambda v: v),
    "epfo_regularity": ("EPFO deposit regularity of {v:.0%}", lambda v: v),
    "top_payer_share": ("top payer at {v:.0%} of revenue", lambda v: v),
    "payer_hhi": ("payer concentration (HHI) of {v:.2f}", lambda v: v),
    "top3_payer_share": ("top-3 payers at {v:.0%} of revenue", lambda v: v),
    "b2b_share": ("B2B dependency of {v:.0%}", lambda v: v),
    "refund_rate": ("refund/reversal rate of {v:.1%}", lambda v: v),
}


def reason_codes(scorer: NaadiScorer, feats: dict, top_n: int = 5) -> dict:
    """Composite-level SHAP -> per-dimension points, drilled into features."""
    sub = scorer.subscores(feats)
    X = np.array([[sub[d] for d in DIMENSIONS]])
    contrib = scorer.composite.booster_.predict(X, pred_contrib=True)[0]  # 6 + bias
    pts = contrib[:-1] * scorer.points_per_logit  # + pts = helps score

    dim_detail: dict[str, list] = {}
    for j, d in enumerate(DIMENSIONS):
        feats_d = dim_features(d)
        Xd = np.array([[feats[f] for f in feats_d]])
        c = scorer.dim_models[d].booster_.predict(Xd, pred_contrib=True)[0][:-1]
        order = np.argsort(np.abs(c))[::-1]
        dim_detail[d] = [feats_d[i] for i in order[:2]]

    entries = []
    for j, d in enumerate(DIMENSIONS):
        drivers = []
        for f in dim_detail[d]:
            tmpl, _ = _F[f]
            drivers.append(tmpl.format(v=feats[f]))
        entries.append({
            "code": f"RC-{d}{j + 1:02d}",
            "dimension": d,
            "dimension_label": DIM_META[d][0],
            "points": round(float(pts[j]), 1),
            "subscore": sub[d],
            "text": "; ".join(drivers),
        })

    entries.sort(key=lambda e: e["points"], reverse=True)
    positive = [e for e in entries if e["points"] > 0][:top_n]
    negative = sorted([e for e in entries if e["points"] <= 0],
                      key=lambda e: e["points"])[:top_n]
    return {"positive": positive, "negative": negative}


# ---------------------------------------------------------------- what-if ----
# Actionable interventions only — never immutable traits (vintage, sector).
_SCENARIOS = [
    ("File GSTR-3B on time for the next 3 months",
     lambda f: {**f, "filing_delay_mean": 0.0, "filing_delay_max": min(f["filing_delay_max"], 2.0),
                "on_time_streak": f["on_time_streak"] + 3}),
    ("Bring top-payer share below 40% by adding 2-3 anchor customers",
     lambda f: {**f, "top_payer_share": min(f["top_payer_share"], 0.40),
                "top3_payer_share": min(f["top3_payer_share"], 0.65),
                "payer_hhi": min(f["payer_hhi"], 0.20)}),
    ("Hold a 30-day cash buffer in the current account",
     lambda f: {**f, "cash_buffer_days": max(f["cash_buffer_days"], 30.0),
                "balance_to_outflow": max(f["balance_to_outflow"], 1.0),
                "eod_negative_days": 0.0}),
    ("Route all EMIs through the surplus account (zero bounces for 6 months)",
     lambda f: {**f, "bounce_count": 0.0, "bounce_rate": 0.0}),
]


def what_if(scorer: NaadiScorer, feats: dict, tier: str, base_score: int) -> list[dict]:
    tips = []
    for label, transform in _SCENARIOS:
        new_score = scorer.score(transform(dict(feats)), tier)["score"]
        delta = new_score - base_score
        if delta >= 3:
            tips.append({"action": label, "delta": int(delta), "new_score": int(new_score)})
    tips.sort(key=lambda t: t["delta"], reverse=True)
    return tips[:3]
