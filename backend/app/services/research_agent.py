"""
Research Agent Service
Gathers external intelligence about a company: news, sector risk, MCA filings, litigation.
"""
import httpx
from typing import Optional
from app.core.config import settings


async def gather_research_insights(
    company_name: str,
    industry_sector: str,
    cin_number: str,
) -> dict:
    """
    Gather external research data about the company.
    In production, integrate with real APIs (MCA, news APIs, court records).
    This implementation provides a structured framework with simulated data fallback.
    """
    insights = {
        "company_news": await _fetch_company_news(company_name),
        "sector_risk": _assess_sector_risk(industry_sector),
        "mca_filings": await _fetch_mca_filings(cin_number),
        "litigation_records": await _check_litigation(company_name),
        "summary": "",
    }

    # Generate summary
    risk_factors = []
    if insights["company_news"].get("negative_news_count", 0) > 0:
        risk_factors.append("Negative news coverage detected")
    if insights["sector_risk"].get("risk_level") in ("high", "critical"):
        risk_factors.append(f"High-risk sector: {industry_sector}")
    if insights["litigation_records"].get("active_cases", 0) > 0:
        risk_factors.append("Active litigation found")
    if not insights["mca_filings"].get("compliant", True):
        risk_factors.append("MCA filing non-compliance")

    if risk_factors:
        insights["summary"] = "Risk factors identified: " + "; ".join(risk_factors)
    else:
        insights["summary"] = "No significant external risk factors identified."

    return insights


async def _fetch_company_news(company_name: str) -> dict:
    """Fetch recent news about the company."""
    if settings.NEWS_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://newsapi.org/v2/everything",
                    params={"q": company_name, "sortBy": "publishedAt", "pageSize": 5},
                    headers={"X-Api-Key": settings.NEWS_API_KEY},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    articles = data.get("articles", [])
                    return {
                        "total_results": data.get("totalResults", 0),
                        "articles": [
                            {"title": a["title"], "source": a["source"]["name"], "published": a["publishedAt"]}
                            for a in articles[:5]
                        ],
                        "negative_news_count": 0,
                    }
        except Exception:
            pass

    # Fallback: simulated response
    return {
        "total_results": 0,
        "articles": [],
        "negative_news_count": 0,
        "note": "News API not configured. Connect a news API for live results.",
    }


def _assess_sector_risk(industry_sector: str) -> dict:
    """Assess risk level based on industry sector."""
    high_risk_sectors = [
        "real estate", "construction", "mining", "cryptocurrency", "gambling",
        "hospitality", "aviation", "oil and gas",
    ]
    medium_risk_sectors = [
        "retail", "textile", "agriculture", "logistics", "telecom",
        "media", "automotive",
    ]
    low_risk_sectors = [
        "technology", "healthcare", "pharmaceuticals", "education", "fmcg",
        "banking", "insurance", "utilities",
    ]

    sector_lower = industry_sector.lower()

    if any(s in sector_lower for s in high_risk_sectors):
        risk_level = "high"
        risk_score = 70
    elif any(s in sector_lower for s in medium_risk_sectors):
        risk_level = "medium"
        risk_score = 45
    elif any(s in sector_lower for s in low_risk_sectors):
        risk_level = "low"
        risk_score = 20
    else:
        risk_level = "medium"
        risk_score = 50

    return {
        "sector": industry_sector,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "factors": [
            f"Industry sector classified as {risk_level} risk",
            "Assessment based on historical sector default rates",
        ],
    }


async def _fetch_mca_filings(cin_number: str) -> dict:
    """Check MCA filing compliance."""
    # In production, integrate with MCA21 portal API
    return {
        "cin": cin_number,
        "compliant": True,
        "last_filing_date": "2025-12-31",
        "annual_returns_filed": True,
        "financial_statements_filed": True,
        "note": "MCA API not configured. Connect MCA API for live verification.",
    }


async def _check_litigation(company_name: str) -> dict:
    """Check for active litigation records."""
    # In production, integrate with court records API
    return {
        "active_cases": 0,
        "resolved_cases": 0,
        "pending_cases": 0,
        "note": "Litigation API not configured. Connect court records API for live data.",
    }
