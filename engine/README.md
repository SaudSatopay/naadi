# NAADI Engine

Python 3.13 · uv · Polars · DuckDB · LightGBM (monotone, native TreeSHAP) · FastAPI · Claude (Opus 4.8)

## Quickstart

```bash
cd engine
uv sync                                  # creates venv, installs deps
uv run python scripts/build_demo.py      # train + score + export demo.json
uv run uvicorn naadi.api:app --port 8000 # optional: decision API
```

`build_demo.py` trains the full two-layer scorer on a 5,000-MSME synthetic
population, prints held-out AUROC/KS, scores the eight demo MSMEs, and writes
`web/src/data/demo.json` (consumed by the web app) plus `artifacts/validation.json`.

Add `--live-memos` (with `ANTHROPIC_API_KEY` set) to have Munshi polish the
underwriting memos via Claude — the offline template keeps everything working
without a key.

## Layout

| Module | Purpose |
|---|---|
| `naadi/personas.py` | 8 archetypes + 8 named demo MSMEs |
| `naadi/generate.py` | latent-risk synthetic data (GST/UPI/AA/EPFO rails) |
| `naadi/features.py` | 27 point-in-time features across the NAADI six dimensions |
| `naadi/scoring.py` | 6 monotone LightGBM scorecards → composite → isotonic PD → 300-900 |
| `naadi/explain.py` | native TreeSHAP reason codes + actionable what-if engine |
| `naadi/limits.py` | cash-flow affordability limit engine + policy guards |
| `naadi/munshi.py` | agentic memo copilot (Claude claude-opus-4-8, offline fallback) |
| `naadi/api.py` | FastAPI: /portfolio, /msme/{id}, /score |
