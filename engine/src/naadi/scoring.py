"""Two-layer scoring brain.

Layer 1: six monotone-constrained LightGBM scorecards, one per dimension,
         each producing a 0-100 subscore (population-percentile of risk).
Layer 2: composite LightGBM over the six subscores (monotone: a better
         subscore can never raise PD), isotonic-calibrated to PD(12m),
         mapped to the familiar 300-900 score band.
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import polars as pl
from lightgbm import LGBMClassifier
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import roc_auc_score, roc_curve

from .features import DIMENSIONS, FEATURES, dim_features

LGBM_PARAMS = dict(
    n_estimators=180, learning_rate=0.06, num_leaves=15, min_child_samples=40,
    subsample=0.9, colsample_bytree=0.9, random_state=42, verbose=-1,
)

GRADE_BANDS = [  # (min_score, grade, posture)
    (800, "A+", "Pre-approved offers"),
    (740, "A", "Fast-track approve"),
    (660, "B", "Approve with standard covenants"),
    (580, "C", "Refer: mitigants / secured variant"),
    (500, "D", "Small-ticket starter products"),
    (300, "E", "Decline with improvement path"),
]

# Tier-calibrated uncertainty band (demo heuristic — sparser rails => wider
# band). Conformal PD intervals replace this once sandbox data lands.
TIER_BAND = {"T3": 15, "T2": 25, "T1": 40}


def grade_for(score: float) -> tuple[str, str]:
    for lo, g, posture in GRADE_BANDS:
        if score >= lo:
            return g, posture
    return "E", GRADE_BANDS[-1][2]


def _logit(p: np.ndarray) -> np.ndarray:
    p = np.clip(p, 1e-5, 1 - 1e-5)
    return np.log(p / (1 - p))


class NaadiScorer:
    """Trainable, serializable scoring engine."""

    def __init__(self):
        self.dim_models: dict[str, LGBMClassifier] = {}
        self.dim_pd_sorted: dict[str, np.ndarray] = {}   # for percentile subscores
        self.composite: LGBMClassifier | None = None
        self.calibrator: IsotonicRegression | None = None
        self.logit_lo: float = -6.0
        self.logit_hi: float = 0.0
        self.metrics: dict = {}

    # ------------------------------------------------------------------ train
    def fit(self, df: pl.DataFrame) -> dict:
        y = df["default"].to_numpy()
        n = len(df)
        rng = np.random.default_rng(7)
        idx = rng.permutation(n)
        n_tr, n_val = int(n * 0.6), int(n * 0.2)
        tr, val, te = idx[:n_tr], idx[n_tr:n_tr + n_val], idx[n_tr + n_val:]

        # Layer 1 — dimension scorecards
        sub = np.zeros((n, len(DIMENSIONS)))
        for j, d in enumerate(DIMENSIONS):
            feats = dim_features(d)
            X = df.select(feats).to_numpy()
            mono = [FEATURES[f][1] for f in feats]
            m = LGBMClassifier(monotone_constraints=mono, **LGBM_PARAMS)
            m.fit(X[tr], y[tr])
            pd_d = m.predict_proba(X)[:, 1]
            self.dim_models[d] = m
            self.dim_pd_sorted[d] = np.sort(pd_d[tr])
            sub[:, j] = self._subscore_from_pd(d, pd_d)

        # Layer 2 — composite over subscores (higher subscore -> lower PD)
        comp = LGBMClassifier(monotone_constraints=[-1] * len(DIMENSIONS), **LGBM_PARAMS)
        comp.fit(sub[tr], y[tr])
        raw_val = comp.predict_proba(sub[val])[:, 1]
        self.composite = comp

        # Calibration on the validation fold (PD reporting). The score itself
        # maps from the raw model's continuous log-odds so neighbouring firms
        # don't collapse onto isotonic plateau steps.
        self.calibrator = IsotonicRegression(out_of_bounds="clip", y_min=1e-4, y_max=0.99)
        self.calibrator.fit(raw_val, y[val])

        raw_tr = comp.predict_proba(sub[tr])[:, 1]
        lo_hi = np.percentile(_logit(raw_tr), [1, 99])
        self.logit_lo, self.logit_hi = float(lo_hi[0]), float(lo_hi[1])

        # Held-out test metrics
        raw_te = comp.predict_proba(sub[te])[:, 1]
        pd_te = self.calibrator.predict(raw_te)
        auroc = float(roc_auc_score(y[te], pd_te))
        fpr, tpr, _ = roc_curve(y[te], pd_te)
        ks = float(np.max(tpr - fpr))
        dim_auc = {
            d: float(roc_auc_score(y[te], self.dim_models[d].predict_proba(
                df.select(dim_features(d)).to_numpy()[te])[:, 1]))
            for d in DIMENSIONS
        }
        self.metrics = {
            "n_train": int(n_tr), "n_val": int(n_val), "n_test": int(len(te)),
            "default_rate": float(y.mean()),
            "auroc_test": round(auroc, 4), "ks_test": round(ks, 4),
            "dimension_auroc_test": {k: round(v, 4) for k, v in dim_auc.items()},
            "n_features": len(FEATURES),
            "note": "Synthetic-population validation of the architecture — not a real-world performance claim. Re-estimated on IDBI sandbox data post-shortlist.",
        }
        return self.metrics

    # -------------------------------------------------------------- inference
    def _subscore_from_pd(self, d: str, pd_d: np.ndarray | float) -> np.ndarray | float:
        """Subscore = 100 * (1 - percentile rank of risk in training pop)."""
        ranks = np.searchsorted(self.dim_pd_sorted[d], pd_d) / len(self.dim_pd_sorted[d])
        return 100.0 * (1.0 - ranks)

    def subscores(self, feats: dict) -> dict[str, float]:
        out = {}
        for d in DIMENSIONS:
            X = np.array([[feats[f] for f in dim_features(d)]])
            pd_d = float(self.dim_models[d].predict_proba(X)[0, 1])
            out[d] = round(float(self._subscore_from_pd(d, pd_d)), 1)
        return out

    def score(self, feats: dict, tier: str = "T3") -> dict:
        sub = self.subscores(feats)
        X = np.array([[sub[d] for d in DIMENSIONS]])
        raw = float(self.composite.predict_proba(X)[0, 1])
        pd12 = float(self.calibrator.predict([raw])[0])
        logit_raw = float(_logit(np.array([raw]))[0])
        span = self.logit_hi - self.logit_lo
        score = float(np.clip(300 + 600 * (self.logit_hi - logit_raw) / span, 300, 900))
        grade, posture = grade_for(score)
        return {
            "subscores": sub,
            "pd_12m": round(pd12, 4),
            "score": int(round(score)),
            "band": TIER_BAND.get(tier, 25),
            "grade": grade,
            "posture": posture,
        }

    @property
    def points_per_logit(self) -> float:
        """Slope converting a log-odds contribution into score points."""
        return -600.0 / (self.logit_hi - self.logit_lo)

    # ------------------------------------------------------------ persistence
    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, path)
        (path.parent / "validation.json").write_text(json.dumps(self.metrics, indent=2))

    @staticmethod
    def load(path: Path) -> "NaadiScorer":
        return joblib.load(path)
