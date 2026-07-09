# NAADI Scoring Methodology

> How four consented data rails become one explainable, actionable Financial Health Card.

## 1. Philosophy

A single opaque number gets a loan rejected and teaches the MSME nothing. NAADI scores **six dimensions** independently, composes them into a calibrated PD and a 300–900 score, and attaches **reason codes + improvement paths** to every output. Three commitments:

- **Directionally trustworthy** — monotone constraints: bad signals can only hurt, good signals can only help.
- **Honest under thin data** — confidence bands widen instead of silently guessing.
- **Actionable** — every card tells the MSME what to *do* to improve.

## 2. The NAADI Six

| # | Dimension | Question it answers | Example features (of ~120) |
|---|---|---|---|
| **L** | **Liquidity** | Can they absorb a shock this month? | avg daily balance ÷ monthly outflow, balance percentiles, EOD-negative days, cash buffer days |
| **S** | **Stability** | How steady is the cash engine? | turnover volatility (CV), UPI daily-inflow entropy, seasonality-adjusted variance, dip-recovery time |
| **G** | **Growth** | Which direction is the business moving? | 6/12-mo turnover slope (GSTR-3B), UPI txn-count momentum, new-payer acquisition rate, wage-base growth |
| **R** | **Repayment** | Do they honour obligations? | EMI/NACH bounce count (AA), delayed-payment ratio, existing-obligation coverage, bureau tradelines when present |
| **C** | **Compliance** | Is the house in order? | GSTR filing-delay distribution, filing streak, ITC mismatch rate, EPFO deposit regularity, Udyam validity |
| **K** | **Concentration** | How fragile is the revenue base? | top-payer share, payer HHI (UPI/AA), B2B dependency ratio, sector cyclicality, geographic spread |

Each dimension → **0–100 subscore** from a monotone-constrained LightGBM scorecard, benchmarked *within sector & vintage peer group* (a kirana store is never judged against a pharma distributor).

## 3. Composite score

```
subscores (L,S,G,R,C,K) + interactions
        → LightGBM PD model (monotone where applicable)
        → isotonic calibration  → PD(12-month)
        → score = 300 + 600 · (1 − normalized log-odds)
```

| Score | Grade | Indicative PD(12m) | Posture |
|---|---|---|---|
| 800–900 | A+ | < 1% | Pre-approved offers |
| 740–799 | A | 1–2% | Fast-track approve |
| 660–739 | B | 2–5% | Approve w/ standard covenants |
| 580–659 | C | 5–10% | Refer: mitigants / secured variant |
| 500–579 | D | 10–18% | Small-ticket starter products |
| 300–499 | E | > 18% | Decline + improvement path |

*(Bands are illustrative for the concept build; final cut-offs are set on sandbox data against IDBI risk appetite.)*

## 4. Thin-file tiers — the financial-inclusion core

| Tier | Data available | NAADI behaviour |
|---|---|---|
| **T3** | GST + AA + UPI + EPFO | Full six-dimension card, tightest confidence band |
| **T2** | GST + (AA or UPI) | Full card; R inferred partly from proxies; band widens |
| **T1** | UPI-only or AA-only | L/S/G/K from flows; C from Udyam/filing stubs; sector priors fill gaps — **this is the NTC kirana store** |
| **T0** | Identity only | No score theatre: onboarding plan + "build your NAADI in 90 days" track |

Mechanics: hierarchical Bayesian priors by (sector × vintage × geography) shrink sparse features toward peer means; **conformal prediction** turns tier sparsity into an explicit PD interval; the card displays **Score Confidence** (e.g., 720 ± 25 at T2) instead of false precision.

## 5. Explainability & reason codes

- **SHAP TreeExplainer** on every score → top-5 positive + top-5 negative contributors.
- Contributors map through a **governed reason-code dictionary** (plain English + Hindi), e.g. `RC-C03: "GSTR-3B filed late in 4 of last 6 months (−31 pts)"`.
- Same codes drive: officer memo, MSME improvement tips, adverse-action compliance.

**What-if engine**: constrained counterfactual search over *actionable* features only — filing punctuality, payer diversification, balance buffer — never immutable ones (vintage, sector). Output: *"On-time GSTR-3B for next 3 months → +22 pts (B → A band)."*

## 6. Limit engine (score → sanctionable number)

Cash-flow-first affordability, not collateral-first:

```
net monthly surplus  = trimmed-mean(consented inflows) − outflows − existing EMIs (AA)
serviceable EMI      = surplus × utilization cap (grade-based 35–55%)
limit                = PV(serviceable EMI, tenor, rate) · dimension guards
```

Dimension guards: L-floor (liquidity days ≥ threshold), K-cap (limit shrinks with payer concentration), C-gate (compliance red flags force refer). Output: **limit + tenor + covenant set** (e.g., quarterly GST-filing covenant, UPI-flow routing covenant) — exactly what Munshi writes into the memo.

## 7. Validation

**Now (synthetic, in this repo)**: 5,000-MSME synthetic population, 8 archetypes, latent-risk generative process; out-of-sample AUROC / KS / calibration reported by `engine` scripts and printed in the demo (labelled *synthetic* everywhere — we validate the architecture, not claim real-world lift).

**Sandbox (Jul 22–31)**: out-of-time split on IDBI data → AUROC, KS, Brier + calibration curves, PSI stability, fairness slices (sector/geo/vintage/gender-of-proprietor where available), swap-set analysis vs. incumbent policy: *how many currently-rejected NTC MSMEs does NAADI safely approve?* — the number that matters for Track 03.

**Honesty note on "accuracy"**: default is a rare event; raw accuracy is a misleading metric. We report AUROC/KS/calibration and business swap-set outcomes — and will happily defend why that's the right yardstick.

## 8. Monitoring & governance

- **Drift**: monthly PSI on features + score; alert > 0.2.
- **Performance**: rolling vintage curves, early-warning (30/60 DPD) hit-rates vs. predicted PD deciles.
- **Retraining**: quarterly champion/challenger (LightGBM vs TabPFN-v2 / FT-Transformer); promotion requires out-of-time win on AUROC *and* calibration *and* PSI stability.
- **Model risk**: model cards, feature lineage, human-in-the-loop declines, reason-code audit trail — aligned to RBI model-risk expectations.
