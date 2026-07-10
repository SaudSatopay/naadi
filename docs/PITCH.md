# NAADI — Pitch & Demo Narrative

> **IDBI Innovate 2026 · Track 03 · Financial Health Score**
> *"Build. Integrate. Transform."*
>
> **Live demo: https://naadi-kappa.vercel.app** · Code: https://github.com/SaudSatopay/naadi

## One-liner

**NAADI reads the financial pulse of credit-invisible MSMEs** — fusing GST, UPI, Account Aggregator and EPFO into an explainable six-dimension Health Card, and handing the loan officer a finished underwriting memo in seconds instead of weeks.

## The problem (as the Bank stated it)

MSME credit evaluation leans on traditional financial documents that New-to-Credit / New-to-Bank enterprises don't have — while rich alternate data sits unused across GST, UPI, AA and EPFO. No unified framework → high rejection rates, missed viable borrowers, thin portfolio diversification, slow financial inclusion.

India has **~6+ crore registered MSMEs** and an MSME credit gap estimated in the **tens of lakh crores (IFC est.)**. The borrowers exist. The data exists. The bridge doesn't.

## Why teams lose this track — and how NAADI wins it

Most entries will train a model and show a number. A number is not a product:

| Typical entry | NAADI |
|---|---|
| One opaque score | **Six explainable dimensions** + composite 300–900 with confidence band |
| "Trust the model" | **SHAP reason codes** on every score — committee-ready, adverse-action-ready |
| Stops at scoring | **Munshi agent** drafts the full underwriting memo: decision, limit, tenor, covenants, early-warning triggers — with evidence links |
| Rejects thin files | **Thin-file tiers**: scores a UPI-only kirana store honestly, with a 90-day "build your NAADI" path |
| Score as verdict | **What-if engine**: "file GST on time 3 months → +22 pts" — turns scoring into financial literacy |
| Slideware integration | **ULI / OCEN / AA-native design** + working FastAPI decision API |

## Demo script (3 minutes)

1. **Portfolio view** — RM dashboard: 8 MSMEs, live health distribution, alerts. *"This is tomorrow morning at an IDBI branch."*
2. **The hero moment** — open **Chandra Kirana Stores** (New-to-Credit, no financials, UPI-heavy): consent → rails light up → six dimensions animate in → **762 ± 40, Grade A** (the wide band is the thin-file tier being honest). *"No balance sheet. Real, defensible score."*
3. **Explainability** — reason codes with signed points: liquidity buffer and payer diversity lifting the score, a soft recent revenue patch flagged and priced in. Click the what-if: **"file GSTR-3B on time for 3 months → +24 pts" — an improvement path shown to the borrower.**
4. **Munshi** — the memo writes itself: recommend **approve ₹9.2L working-capital line, 36m**, GST-filing covenant, flow-routing covenant, three early-warning triggers — every number traceable to a feature. *"Officer reviews, clicks approve. Minutes, not weeks."*
5. **The stressed case** — auto-parts maker sliding: Stability and Repayment dims flash early-warning 5 months before the cliff. *"NAADI isn't just origination — it's portfolio radar."*
6. **Close** — *"Score → reasons → decision → memo → monitoring. One pulse. That's NAADI."*

## Business impact (sandbox-measurable)

- **Swap-set**: % of today's NTC rejects NAADI safely approves (target: material uplift at flat risk).
- **TAT**: application-to-decision from days → **< 5 minutes** on ULI flows.
- **Officer productivity**: memo drafting ~2 hrs → ~2 min review.
- **Portfolio quality**: 12-month early-warning coverage on emerging stress (bridges Track 04 as roadmap).
- **Inclusion**: every decline ships with an improvement path — declined-today ≠ lost-forever.

## Roadmap

| Phase | Milestone |
|---|---|
| Jul 9 | Concept + working synthetic demo (this repo) |
| Jul 22–31 | Sandbox: retrain, validation report, live-data demo |
| Aug 13 | Demo day: end-to-end consented flow |
| PoC | LOS integration, pilot branch cohort, swap-set study |
| Scale | ULI/OCEN embedded journeys, vernacular MSME app, Track-04-grade EWS |

## Team

Team of 3 — full-stack + ML + fintech domain (merchant/POS data DNA). Built with a bleeding-edge stack: Next.js 16 / React 19 / Tailwind v4 / Motion · Python 3.13 / uv / FastAPI / Polars / DuckDB · LightGBM + SHAP + conformal calibration · LangGraph + Claude frontier models.

---

*NAADI (नाड़ी) — the pulse. In Ayurveda, a vaidya diagnoses the whole body from the naadi. NAADI diagnoses the whole business from its cash pulse.*
