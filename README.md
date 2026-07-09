# NAADI — नाड़ी

**Reading the financial pulse of India's 64 million MSMEs.**

An AI-native **MSME Financial Health Card** + **Munshi, an agentic underwriting copilot** — built for **IDBI Innovate 2026 · Track 03: Financial Health Score** (*"Build. Integrate. Transform."*).

> Just as a vaidya reads the *naadi* (pulse) to diagnose the body, NAADI reads GST, UPI, Account Aggregator and EPFO flows to diagnose the financial health of a business — in seconds, with full explainability.

## The problem

MSME credit evaluation leans on traditional financial documents that New-to-Credit / New-to-Bank enterprises don't have. Rich alternate data exists — GST returns, UPI flows, AA bank statements, EPFO payrolls — but no unified assessment framework. Result: high rejection rates, missed viable borrowers, slow financial inclusion.

## What NAADI does

**Score → reasons → decision → memo → monitoring. One pulse.**

1. **Fuses four consented rails** (GST · UPI · AA · EPFO) into a point-in-time feature store — consent-first, DPDP-aligned.
2. **Scores six dimensions** — Liquidity, Stability, Growth, Repayment, Compliance, Concentration — with monotone LightGBM scorecards a credit committee can trust, composed into an isotonic-calibrated PD(12m) and a 300–900 score **with an honest, tier-based confidence band**.
3. **Explains every point**: native TreeSHAP reason codes in plain language, plus a **what-if engine** ("file GSTR-3B on time for 3 months → +24 pts") that turns declines into improvement paths.
4. **Munshi drafts the memo**: decision, limit, tenor, covenants, early-warning triggers — the LLM (Claude Opus 4.8) writes prose, the deterministic engine writes every number.
5. **Ships as a product**: an RM console + interactive Health Card with a replayable agentic run, and a FastAPI decision service ready for ULI / OCEN / LOS rails.

## Try it (two commands per side)

```bash
# 1 · engine — train, validate, export the demo book
cd engine
uv sync && uv run python scripts/build_demo.py

# 2 · console — the Health Card UI
cd ../web
npm install && npm run dev     # → http://localhost:3000
```

The build prints held-out validation (currently **AUROC 0.871 · KS 0.576** on a 5,000-MSME synthetic population — an architecture proof, not a market claim; the connector layer swaps to IDBI sandbox data with zero downstream changes).

Optional: `uv run uvicorn naadi.api:app --port 8000` for the `POST /score` decision API, and `--live-memos` (with `ANTHROPIC_API_KEY`) to let Munshi polish memos via Claude.

## Repository

```
docs/     ARCHITECTURE.md · SCORING.md · PITCH.md
engine/   Python 3.13 + uv · Polars · DuckDB · LightGBM (monotone, TreeSHAP) · FastAPI · Claude
web/      Next.js 16 · React 19 · Tailwind v4 · Motion 12 · Recharts 3 (Turbopack, fully static)
```

## The stack, deliberately bleeding-edge

| Layer | Choices |
|---|---|
| Web | Next.js 16 App Router · React 19 · Tailwind CSS v4 · Motion · Recharts |
| Engine | Python 3.13 · uv · Polars · DuckDB · scikit-learn 1.9 · LightGBM 4.6 |
| ML | Monotone-constrained scorecards · isotonic calibration · native TreeSHAP · counterfactual what-ifs |
| Copilot | Claude Opus 4.8 (adaptive thinking) with a deterministic offline fallback |
| Scale path | Kafka → Iceberg · Feast · MLflow · EKS · OpenTelemetry · Langfuse |

## Status

- ✅ Concept build for the **July 9** submission — docs, trained engine, working console
- 🔜 **Jul 22–31**: retrain + validation report on IDBI sandbox data, live-data demo
- 🔜 **Aug 13**: demo day — end-to-end consented flow

---

*Team NAADI · IDBI Innovate 2026 · Track 03*
