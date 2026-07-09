"""Synthetic MSME data generator.

A single latent health factor theta drives every observable: turnover level and
trend, volatility, filing discipline, bounces, balances, concentration. This
gives the feature -> label signal a realistic correlated structure, so the
models we train demonstrate the true architecture end-to-end. Swap this module
for the IDBI sandbox connectors post-shortlist; nothing downstream changes.
"""

from __future__ import annotations

import numpy as np

from .personas import ARCHETYPES, DEMO_PERSONAS, Archetype, DemoPersona

MONTHS = 24
TIERS = ["T1", "T2", "T3"]


def _sigmoid(x: float | np.ndarray):
    return 1.0 / (1.0 + np.exp(-x))


def generate_msme(
    rng: np.random.Generator,
    arch: Archetype,
    theta: float,
    tier: str,
    overrides: dict | None = None,
) -> dict:
    """Generate 24 months of consented-rail observables for one MSME."""
    ov = overrides or {}
    t = np.arange(MONTHS)

    # --- GST turnover series -------------------------------------------------
    base = arch.base_turnover * rng.lognormal(0, 0.25)
    growth = 0.004 + 0.010 * theta + ov.get("growth_boost", 0.0)
    if ov.get("declining"):
        growth = -0.028
    season = arch.seasonality * np.sin(2 * np.pi * (t + rng.integers(0, 12)) / 12)
    noise_sd = np.clip(0.16 - 0.05 * theta, 0.04, 0.30)
    noise = rng.normal(0, noise_sd, MONTHS)
    turnover = base * (1 + growth) ** t * (1 + 0.5 * season) * np.exp(noise)
    if ov.get("lumpy"):
        # contractor pattern: dry spells punctuated by large receipts
        mask = rng.random(MONTHS) < 0.4
        turnover = np.where(mask, turnover * 2.6, turnover * 0.35)
    turnover = np.maximum(turnover, 10_000)

    # --- GST filing discipline ----------------------------------------------
    delay_mu = np.clip(2.5 - 3.2 * theta, 0.0, 18.0) + ov.get("filing_delay_bias", 0.0)
    filing_delay = np.maximum(rng.normal(delay_mu, 2.2, MONTHS), 0.0)
    filing_delay = np.where(rng.random(MONTHS) < _sigmoid(1.8 + 1.2 * theta), 0.0, filing_delay)
    if ov.get("improving_compliance"):
        filing_delay = filing_delay * np.linspace(1.6, 0.15, MONTHS)
    itc_mismatch = float(np.clip(rng.normal(0.05 - 0.04 * theta, 0.02), 0.0, 0.35))

    # --- UPI rail -------------------------------------------------------------
    upi_share = np.clip(arch.upi_share + rng.normal(0, 0.05), 0.02, 0.98)
    upi_inflow = turnover * upi_share * np.exp(rng.normal(0, 0.08, MONTHS))
    ticket = rng.uniform(150, 2500) if arch.upi_share > 0.5 else rng.uniform(2500, 60_000)
    upi_txn_count = np.maximum((upi_inflow / ticket).astype(int), 1)
    new_payer_rate = float(np.clip(0.10 + 0.06 * theta + rng.normal(0, 0.03), 0.005, 0.5))
    refund_rate = float(np.clip(0.015 - 0.008 * theta + rng.normal(0, 0.006), 0.0, 0.12))

    # --- Concentration ---------------------------------------------------------
    top_payer = ov.get(
        "top_payer_share",
        float(np.clip(arch.b2b_share * 0.45 - 0.06 * theta + rng.normal(0, 0.08), 0.02, 0.92)),
    )
    hhi = float(np.clip(top_payer**2 + rng.uniform(0.01, 0.08), 0.01, 0.95))
    top3 = float(np.clip(top_payer + rng.uniform(0.05, 0.2), top_payer, 0.99))

    # --- Account Aggregator (bank) rail ----------------------------------------
    outflow = turnover * rng.uniform(0.82, 0.97)
    buffer_ratio = np.clip(0.45 + 0.55 * theta + rng.normal(0, 0.15), 0.02, 3.0)
    avg_balance = outflow * buffer_ratio / 12
    balance_series = avg_balance * np.exp(rng.normal(0, 0.25, MONTHS)) * (turnover / turnover.mean())
    eod_negative_days = int(np.clip(rng.poisson(max(0.1, 4.0 - 4.5 * theta)), 0, 90))
    bounce_count = int(ov.get("bounce_count", np.clip(rng.poisson(max(0.02, 0.9 - 1.1 * theta)), 0, 12)))
    existing_emi = turnover.mean() * float(np.clip(rng.normal(0.06, 0.03), 0.0, 0.30))

    # --- EPFO rail --------------------------------------------------------------
    headcount = max(int(turnover.mean() / rng.uniform(120_000, 400_000)), 1)
    wage_growth = float(np.clip(0.03 + 0.05 * theta + rng.normal(0, 0.02), -0.15, 0.30))
    epfo_regular = float(np.clip(_sigmoid(1.5 + 1.8 * theta) + rng.normal(0, 0.05), 0.2, 1.0))

    # --- Default label (12m forward) ---------------------------------------------
    shock = rng.normal(0, 0.6)
    p_default = float(_sigmoid(-2.35 - 2.1 * theta + 0.9 * arch.cyclicality * abs(shock)))
    default = int(rng.random() < p_default)

    return {
        "archetype": arch.key,
        "sector": arch.sector,
        "cyclicality": arch.cyclicality,
        "tier": tier,
        "theta": theta,
        "turnover": turnover,
        "filing_delay": filing_delay,
        "itc_mismatch": itc_mismatch,
        "upi_inflow": upi_inflow,
        "upi_txn_count": upi_txn_count,
        "new_payer_rate": new_payer_rate,
        "refund_rate": refund_rate,
        "top_payer_share": top_payer,
        "payer_hhi": hhi,
        "top3_payer_share": top3,
        "b2b_share": arch.b2b_share,
        "balance_series": balance_series,
        "monthly_outflow": outflow.mean() if hasattr(outflow, "mean") else float(outflow),
        "eod_negative_days": eod_negative_days,
        "bounce_count": bounce_count,
        "existing_emi": existing_emi,
        "headcount": headcount,
        "wage_growth": wage_growth,
        "epfo_regularity": epfo_regular,
        "p_default_true": p_default,
        "default": default,
    }


def generate_population(n: int = 5000, seed: int = 42) -> list[dict]:
    """Synthetic training population across all archetypes."""
    rng = np.random.default_rng(seed)
    keys = list(ARCHETYPES)
    out = []
    for i in range(n):
        arch = ARCHETYPES[keys[rng.integers(0, len(keys))]]
        theta = float(rng.normal(arch.theta_mean, arch.theta_sd))
        tier = TIERS[int(rng.choice([0, 1, 2], p=[0.30, 0.35, 0.35]))]
        rec = generate_msme(rng, arch, theta, tier)
        rec["id"] = f"SYN-{i:05d}"
        out.append(rec)
    return out


def generate_demo_msmes() -> list[dict]:
    """The eight named demo MSMEs, deterministic via per-persona seeds."""
    out = []
    for p in DEMO_PERSONAS:
        rng = np.random.default_rng(p.seed)
        arch = ARCHETYPES[p.archetype]
        rec = generate_msme(rng, arch, p.theta, p.tier, p.overrides)
        rec.update(
            id=p.id, name=p.name, city=p.city, state=p.state,
            vintage_years=p.vintage_years, story=p.story, proprietor=p.proprietor,
            archetype_label=arch.label,
        )
        out.append(rec)
    return out
