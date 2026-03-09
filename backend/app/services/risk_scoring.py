"""
Credit Risk Scoring Service
Implements Five Cs of Credit framework: Character, Capacity, Capital, Collateral, Conditions.
Generates a composite risk score between 0-100.
"""
from typing import Optional


def calculate_risk_score(
    financial_data: dict,
    cross_verification: dict,
    research_insights: dict,
    requested_loan_amount: float,
    industry_sector: str,
) -> dict:
    """
    Calculate credit risk score based on the Five Cs of Credit.
    Returns a score 0-100 (higher = lower risk / better creditworthiness).
    """
    character_score = _evaluate_character(cross_verification, research_insights)
    capacity_score = _evaluate_capacity(financial_data, requested_loan_amount)
    capital_score = _evaluate_capital(financial_data)
    collateral_score = _evaluate_collateral(financial_data)
    conditions_score = _evaluate_conditions(research_insights, industry_sector)

    # Weighted composite score
    weights = {
        "character": 0.20,
        "capacity": 0.30,
        "capital": 0.20,
        "collateral": 0.15,
        "conditions": 0.15,
    }

    composite_score = (
        character_score * weights["character"]
        + capacity_score * weights["capacity"]
        + capital_score * weights["capital"]
        + collateral_score * weights["collateral"]
        + conditions_score * weights["conditions"]
    )

    composite_score = round(max(0, min(100, composite_score)), 1)

    if composite_score >= 75:
        risk_level = "low"
    elif composite_score >= 50:
        risk_level = "medium"
    elif composite_score >= 30:
        risk_level = "high"
    else:
        risk_level = "critical"

    return {
        "composite_score": composite_score,
        "risk_level": risk_level,
        "five_cs": {
            "character": {
                "score": character_score,
                "weight": weights["character"],
                "details": _character_details(cross_verification, research_insights),
            },
            "capacity": {
                "score": capacity_score,
                "weight": weights["capacity"],
                "details": _capacity_details(financial_data, requested_loan_amount),
            },
            "capital": {
                "score": capital_score,
                "weight": weights["capital"],
                "details": _capital_details(financial_data),
            },
            "collateral": {
                "score": collateral_score,
                "weight": weights["collateral"],
                "details": _collateral_details(financial_data),
            },
            "conditions": {
                "score": conditions_score,
                "weight": weights["conditions"],
                "details": _conditions_details(research_insights, industry_sector),
            },
        },
    }


def _evaluate_character(cross_verification: dict, research: dict) -> float:
    """Evaluate Character: repayment history, compliance, integrity."""
    score = 70.0  # Base score

    verification_score = cross_verification.get("verification_score", 50)
    score += (verification_score - 50) * 0.3

    if cross_verification.get("revenue_mismatch"):
        score -= 15

    suspicious = cross_verification.get("suspicious_patterns", [])
    score -= len(suspicious) * 5

    litigation = research.get("litigation_records", {})
    if litigation.get("active_cases", 0) > 0:
        score -= 20
    mca = research.get("mca_filings", {})
    if not mca.get("compliant", True):
        score -= 15

    return max(0, min(100, score))


def _evaluate_capacity(financial_data: dict, loan_amount: float) -> float:
    """Evaluate Capacity: ability to repay the loan."""
    score = 60.0

    gst = financial_data.get("gst_filing", {})
    bank = financial_data.get("bank_statement", {})
    itr = financial_data.get("income_tax_return", {})

    revenue = gst.get("reported_revenue", 0) or bank.get("total_credits", 0)
    if revenue > 0:
        debt_to_revenue = loan_amount / revenue
        if debt_to_revenue < 0.3:
            score += 25
        elif debt_to_revenue < 0.5:
            score += 15
        elif debt_to_revenue < 1.0:
            score += 5
        else:
            score -= 15

    gross_income = itr.get("gross_income", 0)
    if gross_income > 0 and loan_amount > 0:
        income_coverage = gross_income / loan_amount
        if income_coverage > 3:
            score += 15
        elif income_coverage > 1.5:
            score += 8

    avg_balance = bank.get("average_balance", 0)
    if avg_balance > loan_amount * 0.1:
        score += 10

    return max(0, min(100, score))


def _evaluate_capital(financial_data: dict) -> float:
    """Evaluate Capital: owner's investment in the business."""
    score = 55.0

    annual = financial_data.get("annual_report", {})
    if annual.get("has_audit_report"):
        score += 15
    if annual.get("has_directors_report"):
        score += 10

    bank = financial_data.get("bank_statement", {})
    credits = bank.get("total_credits", 0)
    debits = bank.get("total_debits", 0)
    if credits > debits and credits > 0:
        net_ratio = (credits - debits) / credits
        score += net_ratio * 20

    return max(0, min(100, score))


def _evaluate_collateral(financial_data: dict) -> float:
    """Evaluate Collateral: assets pledged as security."""
    score = 50.0

    legal = financial_data.get("legal_document", {})
    if legal.get("has_mortgage_mention"):
        score += 25
    if not legal.get("has_litigation_mention"):
        score += 10

    return max(0, min(100, score))


def _evaluate_conditions(research: dict, industry: str) -> float:
    """Evaluate Conditions: economic environment and industry risk."""
    score = 60.0

    sector = research.get("sector_risk", {})
    sector_risk = sector.get("risk_level", "medium")
    if sector_risk == "low":
        score += 25
    elif sector_risk == "medium":
        score += 10
    elif sector_risk == "high":
        score -= 15
    elif sector_risk == "critical":
        score -= 30

    news = research.get("company_news", {})
    negative_count = news.get("negative_news_count", 0)
    score -= negative_count * 5

    return max(0, min(100, score))


def _character_details(cv: dict, r: dict) -> str:
    parts = []
    if cv.get("revenue_mismatch"):
        parts.append("Revenue mismatch detected across documents")
    if not cv.get("suspicious_patterns"):
        parts.append("No suspicious financial patterns detected")
    litigation = r.get("litigation_records", {})
    if litigation.get("active_cases", 0) == 0:
        parts.append("No active litigation found")
    return ". ".join(parts) if parts else "Evaluation based on available data."


def _capacity_details(fd: dict, loan: float) -> str:
    revenue = fd.get("gst_filing", {}).get("reported_revenue", 0)
    if revenue > 0:
        ratio = loan / revenue
        return f"Debt-to-revenue ratio: {ratio:.2f}. {'Healthy' if ratio < 0.5 else 'Elevated'} leverage."
    return "Limited financial data available for capacity assessment."


def _capital_details(fd: dict) -> str:
    annual = fd.get("annual_report", {})
    if annual.get("has_audit_report"):
        return "Audited financials available. Capital assessment based on verified data."
    return "Capital evaluation based on available financial documents."


def _collateral_details(fd: dict) -> str:
    legal = fd.get("legal_document", {})
    if legal.get("has_mortgage_mention"):
        return "Collateral/mortgage documentation found."
    return "No specific collateral documentation detected."


def _conditions_details(r: dict, industry: str) -> str:
    sector = r.get("sector_risk", {})
    level = sector.get("risk_level", "medium")
    return f"Industry: {industry}. Sector risk assessment: {level}."
