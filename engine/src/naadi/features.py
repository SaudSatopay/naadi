"""Feature engineering: raw rail observables -> model features.

Features are grouped by NAADI dimension (L, S, G, R, C, K). Each feature
declares a monotone direction w.r.t. default risk, enforced in the LightGBM
scorecards so a credit committee can trust directionality.
"""

from __future__ import annotations

import numpy as np
import polars as pl

# feature -> (dimension, monotone direction toward default=1)
FEATURES: dict[str, tuple[str, int]] = {
    # L — Liquidity
    "cash_buffer_days":        ("L", -1),
    "balance_to_outflow":      ("L", -1),
    "balance_p10_ratio":       ("L", -1),
    "eod_negative_days":       ("L", +1),
    # S — Stability
    "turnover_cv":             ("S", +1),
    "upi_inflow_cv":           ("S", +1),
    "worst_3mo_drawdown":      ("S", +1),
    "seasonal_amplitude":      ("S", +1),
    # G — Growth
    "turnover_slope_6m":       ("G", -1),
    "turnover_slope_12m":      ("G", -1),
    "upi_txn_momentum":        ("G", -1),
    "new_payer_rate":          ("G", -1),
    "wage_growth":             ("G", -1),
    # R — Repayment
    "bounce_count":            ("R", +1),
    "bounce_rate":             ("R", +1),
    "emi_coverage":            ("R", -1),
    "obligation_ratio":        ("R", +1),
    # C — Compliance
    "filing_delay_mean":       ("C", +1),
    "filing_delay_max":        ("C", +1),
    "on_time_streak":          ("C", -1),
    "itc_mismatch":            ("C", +1),
    "epfo_regularity":         ("C", -1),
    # K — Concentration
    "top_payer_share":         ("K", +1),
    "payer_hhi":               ("K", +1),
    "top3_payer_share":        ("K", +1),
    "b2b_share":               ("K", +1),
    "refund_rate":             ("K", +1),
}

DIMENSIONS = ["L", "S", "G", "R", "C", "K"]

DIM_META = {
    "L": ("Liquidity", "Can the business absorb a shock this month?"),
    "S": ("Stability", "How steady is the cash engine?"),
    "G": ("Growth", "Which direction is the business moving?"),
    "R": ("Repayment", "Does it honour its obligations?"),
    "C": ("Compliance", "Is the regulatory house in order?"),
    "K": ("Concentration", "How fragile is the revenue base?"),
}


def dim_features(dim: str) -> list[str]:
    return [f for f, (d, _) in FEATURES.items() if d == dim]


def _slope(y: np.ndarray) -> float:
    """Normalized linear trend: slope per month / mean level."""
    x = np.arange(len(y))
    if y.mean() <= 0:
        return 0.0
    return float(np.polyfit(x, y, 1)[0] / y.mean())


def extract_features(rec: dict) -> dict:
    """One MSME record -> flat feature dict."""
    tv: np.ndarray = rec["turnover"]
    upi: np.ndarray = rec["upi_inflow"]
    bal: np.ndarray = rec["balance_series"]
    fd: np.ndarray = rec["filing_delay"]
    txn: np.ndarray = rec["upi_txn_count"]
    outflow = max(rec["monthly_outflow"], 1.0)

    # rolling 3-month sums for drawdown
    k = np.convolve(tv, np.ones(3), "valid")
    drawdown = float(1 - k.min() / max(k.max(), 1.0))

    # trailing on-time streak (months with zero delay, counted from latest)
    streak = 0
    for d in fd[::-1]:
        if d <= 0.5:
            streak += 1
        else:
            break

    monthly_emi = rec["existing_emi"]
    surplus = tv.mean() - outflow

    f = {
        "cash_buffer_days": float(bal.mean() / (outflow / 30)),
        "balance_to_outflow": float(bal.mean() / outflow),
        "balance_p10_ratio": float(np.percentile(bal, 10) / outflow),
        "eod_negative_days": float(rec["eod_negative_days"]),
        "turnover_cv": float(tv.std() / max(tv.mean(), 1.0)),
        "upi_inflow_cv": float(upi.std() / max(upi.mean(), 1.0)),
        "worst_3mo_drawdown": drawdown,
        "seasonal_amplitude": float((tv.max() - tv.min()) / max(tv.mean(), 1.0)),
        "turnover_slope_6m": _slope(tv[-6:]),
        "turnover_slope_12m": _slope(tv[-12:]),
        "upi_txn_momentum": _slope(txn[-6:].astype(float)),
        "new_payer_rate": rec["new_payer_rate"],
        "wage_growth": rec["wage_growth"],
        "bounce_count": float(rec["bounce_count"]),
        "bounce_rate": float(rec["bounce_count"]) / 12.0,
        "emi_coverage": float(np.clip(surplus / max(monthly_emi, 1.0), -5, 50)),
        "obligation_ratio": float(monthly_emi / max(tv.mean(), 1.0)),
        "filing_delay_mean": float(fd.mean()),
        "filing_delay_max": float(fd.max()),
        "on_time_streak": float(streak),
        "itc_mismatch": rec["itc_mismatch"],
        "epfo_regularity": rec["epfo_regularity"],
        "top_payer_share": rec["top_payer_share"],
        "payer_hhi": rec["payer_hhi"],
        "top3_payer_share": rec["top3_payer_share"],
        "b2b_share": rec["b2b_share"],
        "refund_rate": rec["refund_rate"],
    }
    return f


def population_frame(records: list[dict]) -> pl.DataFrame:
    """Feature frame for a population, plus label & metadata columns."""
    rows = []
    for r in records:
        row = extract_features(r)
        row.update(id=r["id"], tier=r["tier"], sector=r["sector"], default=r["default"])
        rows.append(row)
    return pl.DataFrame(rows)
