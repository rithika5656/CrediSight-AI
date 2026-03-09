"""
AI Recommendation Engine
Generates loan decisions, recommended limits, and risk-based interest rates
with explainable reasoning.
"""


def generate_recommendation(
    risk_score: float,
    risk_level: str,
    five_cs: dict,
    requested_amount: float,
    financial_data: dict,
    cross_verification: dict,
) -> dict:
    """
    Generate AI-powered lending recommendation.
    """
    decision = _determine_decision(risk_score, risk_level)
    recommended_limit = _calculate_recommended_limit(risk_score, requested_amount, financial_data)
    interest_rate = _calculate_interest_rate(risk_score, risk_level)
    reasoning = _build_reasoning(risk_score, risk_level, five_cs, cross_verification, decision)

    return {
        "decision": decision,
        "recommended_loan_limit": round(recommended_limit, 2),
        "suggested_interest_rate": round(interest_rate, 2),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "reasoning": reasoning,
        "conditions": _generate_conditions(risk_level, cross_verification),
    }


def _determine_decision(risk_score: float, risk_level: str) -> str:
    if risk_score >= 60:
        return "approve"
    elif risk_score >= 40:
        return "approve"  # With conditions
    else:
        return "reject"


def _calculate_recommended_limit(risk_score: float, requested: float, financial_data: dict) -> float:
    gst_revenue = financial_data.get("gst_filing", {}).get("reported_revenue", 0)
    bank_credits = financial_data.get("bank_statement", {}).get("total_credits", 0)
    reference_revenue = max(gst_revenue, bank_credits)

    if risk_score >= 75:
        limit_factor = 1.0
    elif risk_score >= 60:
        limit_factor = 0.85
    elif risk_score >= 40:
        limit_factor = 0.6
    else:
        limit_factor = 0.0

    recommended = requested * limit_factor

    # Cap at reasonable proportion of revenue
    if reference_revenue > 0:
        max_limit = reference_revenue * 0.5
        recommended = min(recommended, max_limit)

    return max(0, recommended)


def _calculate_interest_rate(risk_score: float, risk_level: str) -> float:
    """Base rate + risk premium."""
    base_rate = 8.5  # Base lending rate

    if risk_score >= 80:
        premium = 0.5
    elif risk_score >= 65:
        premium = 1.5
    elif risk_score >= 50:
        premium = 3.0
    elif risk_score >= 35:
        premium = 5.0
    else:
        premium = 7.5

    return base_rate + premium


def _build_reasoning(
    risk_score: float,
    risk_level: str,
    five_cs: dict,
    cross_verification: dict,
    decision: str,
) -> list:
    reasons = []

    reasons.append(f"Composite credit score: {risk_score}/100 ({risk_level} risk)")

    # Five Cs analysis
    for c_name, c_data in five_cs.items():
        score = c_data.get("score", 0)
        details = c_data.get("details", "")
        if score >= 70:
            reasons.append(f"{c_name.title()}: Strong ({score}/100). {details}")
        elif score >= 50:
            reasons.append(f"{c_name.title()}: Moderate ({score}/100). {details}")
        else:
            reasons.append(f"{c_name.title()}: Weak ({score}/100). {details}")

    # Cross-verification
    if cross_verification.get("revenue_mismatch"):
        pct = cross_verification.get("mismatch_percentage", 0)
        reasons.append(f"Financial discrepancy: Revenue mismatch of {pct}% detected across documents")

    suspicious = cross_verification.get("suspicious_patterns", [])
    for pattern in suspicious:
        reasons.append(f"Flag: {pattern}")

    if decision == "approve":
        reasons.append("Recommendation: APPROVE - Credit profile meets lending criteria")
    else:
        reasons.append("Recommendation: REJECT - Credit risk exceeds acceptable threshold")

    return reasons


def _generate_conditions(risk_level: str, cross_verification: dict) -> list:
    conditions = []

    if risk_level in ("medium", "high"):
        conditions.append("Quarterly financial review required")
        conditions.append("Enhanced monitoring of account activity")

    if risk_level == "high":
        conditions.append("Additional collateral may be required")
        conditions.append("Shorter loan tenure recommended")

    if cross_verification.get("revenue_mismatch"):
        conditions.append("Resolution of financial discrepancies required before disbursement")

    if not conditions:
        conditions.append("Standard loan monitoring terms apply")

    return conditions
