"""Limit engine: cash-flow-first affordability -> sanctionable number.

limit = PV(serviceable EMI, tenor, rate) shaped by dimension guards.
The LLM never touches these numbers — they are deterministic policy.
"""

from __future__ import annotations

GRADE_POLICY = {
    #        util  tenor  rate   decision
    "A+": (0.55, 36, 0.105, "APPROVE"),
    "A":  (0.50, 36, 0.110, "APPROVE"),
    "B":  (0.45, 24, 0.120, "APPROVE"),
    "C":  (0.40, 18, 0.130, "REFER"),
    "D":  (0.35, 12, 0.140, "SMALL_TICKET"),
    "E":  (0.00, 0,  0.000, "DECLINE"),
}

DECISION_LABEL = {
    "APPROVE": "Approve",
    "REFER": "Refer to credit committee",
    "SMALL_TICKET": "Offer starter product",
    "DECLINE": "Decline with improvement path",
}


def _annuity_pv(emi: float, annual_rate: float, months: int) -> float:
    if months <= 0 or emi <= 0:
        return 0.0
    r = annual_rate / 12
    return emi * (1 - (1 + r) ** -months) / r


def recommend(grade: str, feats: dict, monthly_inflow: float,
              monthly_outflow: float, existing_emi: float) -> dict:
    util, tenor, rate, decision = GRADE_POLICY[grade]
    surplus = max(monthly_inflow - monthly_outflow - existing_emi, 0.0)
    serviceable_emi = surplus * util
    limit = _annuity_pv(serviceable_emi, rate, tenor)

    guards, covenants = [], []

    # L-floor: thin liquidity haircuts the line
    if feats["cash_buffer_days"] < 15:
        limit *= 0.80
        guards.append("Liquidity floor: buffer < 15 days — limit reduced 20%")
        covenants.append("Maintain minimum average balance of 15 days' outflow")

    # K-cap: concentrated books get shorter leashes
    if feats["top_payer_share"] > 0.50:
        limit *= 0.75
        guards.append("Concentration cap: top payer > 50% — limit reduced 25%")
        covenants.append("Diversify: no single payer above 50% of receipts by month 12")

    # C-gate: compliance red flags force human review
    if feats["filing_delay_mean"] > 6 and decision == "APPROVE":
        decision = "REFER"
        guards.append("Compliance gate: average filing delay > 6 days — routed to committee")

    covenants.append("File GSTR-3B on or before due date throughout the loan tenor")
    if feats["bounce_count"] > 0:
        covenants.append("Zero EMI/NACH bounces; auto-review on first bounce")
    covenants.append("Route >= 60% of business receipts through the IDBI current account")

    early_warning = [
        "3-month turnover drawdown > 25% vs trailing average",
        "Two consecutive delayed GSTR-3B filings",
        "End-of-day negative balance on > 5 days in any month",
    ]

    limit = round(limit / 10_000) * 10_000  # round to nearest 10k
    return {
        "decision": decision,
        "decision_label": DECISION_LABEL[decision],
        "limit": int(limit if decision in ("APPROVE", "REFER") else
                     min(limit, 200_000) if decision == "SMALL_TICKET" else 0),
        "tenor_months": tenor,
        "indicative_rate": rate,
        "serviceable_emi": int(serviceable_emi),
        "monthly_surplus": int(surplus),
        "guards": guards,
        "covenants": covenants[:4],
        "early_warning": early_warning,
    }
