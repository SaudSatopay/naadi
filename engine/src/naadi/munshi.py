"""Munshi — the agentic underwriting copilot.

Deterministic pipeline (mirrors the production LangGraph topology):

    verify_consent -> pull_rails -> compute_features -> score
        -> policy_check -> draft_memo -> evidence_link -> officer_review

Guardrail: the LLM writes prose, never numbers. Every figure in the memo is
injected from the scoring/limit engines via the fact sheet; Claude narrates
around structured facts. Offline template fallback keeps the demo
independent of network/API keys.
"""

from __future__ import annotations

import os

MODEL = "claude-opus-4-8"


# ------------------------------------------------------------- fact sheet ----
def fact_sheet(m: dict) -> dict:
    """Structured, evidence-linked facts for one scored MSME."""
    return {
        "identity": {k: m[k] for k in ("id", "name", "city", "state", "sector",
                                       "vintage_years", "proprietor", "tier")},
        "score": m["scoring"],
        "reasons": m["reasons"],
        "recommendation": m["recommendation"],
        "monthly_turnover_inr": m["monthly_turnover"],
        "red_flags": m["red_flags"],
    }


# ------------------------------------------------------ template renderer ----
def render_memo(fs: dict) -> str:
    idn, sc, rec = fs["identity"], fs["score"], fs["recommendation"]
    pos = fs["reasons"]["positive"][:3]
    neg = fs["reasons"]["negative"][:3]
    inr = lambda v: f"₹{v:,.0f}"

    lines = [
        f"## Underwriting Memo — {idn['name']}",
        f"*{idn['sector']} · {idn['city']}, {idn['state']} · {idn['vintage_years']} yrs vintage · "
        f"Data tier {idn['tier']} · Proprietor: {idn['proprietor']}*",
        "",
        f"**NAADI Score: {sc['score']} ± {sc['band']} (Grade {sc['grade']}) · "
        f"PD(12m) {sc['pd_12m']:.1%} · {sc['posture']}**",
        "",
        f"### Recommendation: {rec['decision_label']}",
    ]
    if rec["limit"] > 0:
        lines.append(
            f"Working-capital line of **{inr(rec['limit'])}** over **{rec['tenor_months']} months** "
            f"at an indicative {rec['indicative_rate']:.1%} p.a. Serviceable EMI {inr(rec['serviceable_emi'])} "
            f"against a verified monthly surplus of {inr(rec['monthly_surplus'])}."
        )
    lines += ["", "### Why (evidence-linked)"]
    for e in pos:
        lines.append(f"- **+{e['points']} pts · {e['dimension_label']}** — {e['text']} `[{e['code']}]`")
    for e in neg:
        lines.append(f"- **{e['points']} pts · {e['dimension_label']}** — {e['text']} `[{e['code']}]`")

    if rec["guards"]:
        lines += ["", "### Policy guards applied"]
        lines += [f"- {g}" for g in rec["guards"]]

    lines += ["", "### Covenants"]
    lines += [f"- {c}" for c in rec["covenants"]]
    lines += ["", "### Early-warning triggers"]
    lines += [f"- {t}" for t in rec["early_warning"]]
    lines += [
        "",
        "*Prepared by Munshi. Every figure traces to a consented data rail; "
        "final authority rests with the sanctioning officer.*",
    ]
    return "\n".join(lines)


# ----------------------------------------------------------- Claude polish ----
def polish_memo(fs: dict, draft: str) -> str:
    """Optional: Claude rewrites the narrative around the injected facts.

    Uses claude-opus-4-8 with adaptive thinking. Falls back to the
    deterministic draft on any failure — the demo must never break on stage.
    """
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return draft
    try:
        import anthropic

        client = anthropic.Anthropic()
        response = client.messages.create(
            model=MODEL,
            max_tokens=2048,
            thinking={"type": "adaptive"},
            system=(
                "You are Munshi, an underwriting copilot at an Indian bank. Rewrite the "
                "memo below into crisp, committee-ready prose. HARD RULES: keep every "
                "number, code, covenant and trigger EXACTLY as given — you may not "
                "invent, alter or drop any figure; keep the markdown section structure; "
                "keep it under 350 words."
            ),
            messages=[{"role": "user", "content": draft}],
        )
        text = "".join(b.text for b in response.content if b.type == "text").strip()
        return text or draft
    except Exception:
        return draft


# ------------------------------------------------------------- agent trace ----
def agent_trace(m: dict) -> list[dict]:
    """The Munshi pipeline steps, with evidence, for the live-scoring replay."""
    sc = m["scoring"]
    return [
        {"step": "verify_consent", "label": "Consent verified",
         "detail": f"AA consent artefact {m['id']}-CA-0626 · GSTN OTP · purpose-bound (DPDP)", "ms": 420},
        {"step": "pull_gst", "label": "GST rail",
         "detail": "24 GSTR-3B returns fetched · turnover & filing discipline extracted", "ms": 1180},
        {"step": "pull_upi", "label": "UPI rail",
         "detail": f"{int(sum(m['series']['upi_txn_count'])):,} transactions aggregated · payer graph built", "ms": 940},
        {"step": "pull_aa", "label": "Account Aggregator",
         "detail": "Bank statement FI data normalized · balances, bounces, obligations", "ms": 1320},
        {"step": "pull_epfo", "label": "EPFO rail",
         "detail": f"ECR filings parsed · headcount {m['headcount']} · wage trend computed", "ms": 610},
        {"step": "features", "label": "Feature fusion",
         "detail": "27 point-in-time features across 6 dimensions", "ms": 240},
        {"step": "score", "label": "Score computed",
         "detail": f"NAADI {sc['score']} ± {sc['band']} · Grade {sc['grade']} · PD(12m) {sc['pd_12m']:.1%}", "ms": 90},
        {"step": "policy", "label": "Policy & limits",
         "detail": f"{m['recommendation']['decision_label']} · limit ₹{m['recommendation']['limit']:,}", "ms": 60},
        {"step": "memo", "label": "Memo drafted",
         "detail": "Evidence-linked underwriting memo ready for officer review", "ms": 850},
    ]
