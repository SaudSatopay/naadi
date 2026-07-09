"""NAADI decision API — FastAPI service over the trained scorer.

Run:  uv run uvicorn naadi.api:app --reload --port 8000
(after `uv run python scripts/build_demo.py` has produced the artifacts)
"""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .explain import reason_codes
from .features import FEATURES
from .scoring import NaadiScorer

ROOT = Path(__file__).resolve().parents[2]
ARTIFACTS = ROOT / "artifacts"
DEMO_JSON = ROOT.parent / "web" / "src" / "data" / "demo.json"

app = FastAPI(title="NAADI Decision API", version="0.1.0")
_scorer: NaadiScorer | None = None
_demo: dict | None = None


def scorer() -> NaadiScorer:
    global _scorer
    if _scorer is None:
        path = ARTIFACTS / "naadi_scorer.pkl"
        if not path.exists():
            raise HTTPException(503, "Model not built. Run scripts/build_demo.py first.")
        _scorer = NaadiScorer.load(path)
    return _scorer


def demo() -> dict:
    global _demo
    if _demo is None:
        if not DEMO_JSON.exists():
            raise HTTPException(503, "Demo data not built. Run scripts/build_demo.py first.")
        _demo = json.loads(DEMO_JSON.read_text(encoding="utf-8"))
    return _demo


class ScoreRequest(BaseModel):
    features: dict[str, float]
    tier: str = "T3"


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": (_scorer is not None)}


@app.get("/portfolio")
def portfolio():
    return demo()["portfolio"]


@app.get("/msme/{msme_id}")
def msme(msme_id: str):
    for m in demo()["msmes"]:
        if m["id"] == msme_id:
            return m
    raise HTTPException(404, f"Unknown MSME {msme_id}")


@app.post("/score")
def score(req: ScoreRequest):
    missing = [f for f in FEATURES if f not in req.features]
    if missing:
        raise HTTPException(422, f"Missing features: {missing}")
    s = scorer()
    result = s.score(req.features, req.tier)
    result["reasons"] = reason_codes(s, req.features)
    return result
