# NAADI — नाड़ी

**Reading the financial pulse of India's 64 million MSMEs.**

An AI-native **MSME Financial Health Card** + **agentic underwriting copilot**, built for **IDBI Innovate 2026 — Track 03: Financial Health Score**.

> Just as a vaidya reads the *naadi* (pulse) to diagnose the body, NAADI reads GST, UPI, Account Aggregator and EPFO flows to diagnose the financial health of a business — in seconds, with full explainability.

## The problem

MSME credit evaluation relies on traditional financial documents that New-to-Credit (NTC) and New-to-Bank (NTB) enterprises simply don't have. Rich alternate data exists — GST returns, UPI flows, AA bank statements, EPFO payrolls — but no unified assessment framework. Result: high rejection rates, missed viable borrowers, and slow financial inclusion.

## What NAADI does

1. **Fuses alternate data** (GST · UPI · AA · EPFO) into a unified feature store — consent-first, DPDP-compliant.
2. **Scores six dimensions** of financial health — not one opaque number — with a composite 300–900 score.
3. **Explains every score** with SHAP-derived reason codes and improvement guidance for the MSME.
4. **Munshi, the agentic copilot**, drafts a complete underwriting memo — decision, credit limit, covenants — for the loan officer.
5. **Integrates with ULI / OCEN / AA** rails for near-real-time, embedded credit decisioning.

## Repository layout

```
docs/     Architecture, scoring methodology, pitch
engine/   Python 3.13 scoring engine — synthetic data, features, LightGBM + SHAP, FastAPI, Munshi agent
web/      Next.js demo — portfolio dashboard + interactive Financial Health Card
```

## Status

🏗️ Concept build for the July 9 submission. Sandbox datasets and bank APIs land after shortlisting (July 22) — the engine is architected to swap synthetic data for sandbox data with zero schema changes.

---

*Team NAADI · IDBI Innovate 2026 · "Build. Integrate. Transform."*
