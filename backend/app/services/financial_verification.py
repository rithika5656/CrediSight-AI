"""
Financial Cross-Verification Service
Compares data across documents to detect discrepancies and suspicious patterns.
"""
from typing import Optional


def cross_verify_financials(financial_data: dict) -> dict:
    """
    Compare GST reported revenue vs bank statement credits and detect mismatches.
    financial_data should contain parsed data from multiple document types.
    """
    results = {
        "revenue_mismatch": False,
        "mismatch_percentage": 0.0,
        "suspicious_patterns": [],
        "verification_score": 100,
        "details": {},
    }

    gst_data = financial_data.get("gst_filing", {})
    bank_data = financial_data.get("bank_statement", {})
    itr_data = financial_data.get("income_tax_return", {})
    annual_data = financial_data.get("annual_report", {})

    # 1. GST Revenue vs Bank Statement Credits
    gst_revenue = gst_data.get("reported_revenue", 0)
    bank_credits = bank_data.get("total_credits", 0)

    if gst_revenue > 0 and bank_credits > 0:
        mismatch_pct = abs(gst_revenue - bank_credits) / max(gst_revenue, bank_credits) * 100
        results["details"]["gst_vs_bank"] = {
            "gst_reported_revenue": gst_revenue,
            "bank_total_credits": bank_credits,
            "mismatch_percentage": round(mismatch_pct, 2),
        }
        if mismatch_pct > 20:
            results["revenue_mismatch"] = True
            results["mismatch_percentage"] = round(mismatch_pct, 2)
            results["suspicious_patterns"].append(
                f"GST reported revenue differs from bank credits by {mismatch_pct:.1f}%"
            )
            results["verification_score"] -= min(30, mismatch_pct)

    # 2. GST Revenue vs ITR Income
    itr_income = itr_data.get("gross_income", 0)
    if gst_revenue > 0 and itr_income > 0:
        itr_mismatch = abs(gst_revenue - itr_income) / max(gst_revenue, itr_income) * 100
        results["details"]["gst_vs_itr"] = {
            "gst_reported_revenue": gst_revenue,
            "itr_gross_income": itr_income,
            "mismatch_percentage": round(itr_mismatch, 2),
        }
        if itr_mismatch > 25:
            results["suspicious_patterns"].append(
                f"GST revenue differs from ITR income by {itr_mismatch:.1f}%"
            )
            results["verification_score"] -= min(20, itr_mismatch * 0.5)

    # 3. Annual Report vs other sources
    annual_revenue = annual_data.get("reported_revenue", 0)
    if annual_revenue > 0 and gst_revenue > 0:
        annual_mismatch = abs(annual_revenue - gst_revenue) / max(annual_revenue, gst_revenue) * 100
        results["details"]["annual_vs_gst"] = {
            "annual_reported_revenue": annual_revenue,
            "gst_reported_revenue": gst_revenue,
            "mismatch_percentage": round(annual_mismatch, 2),
        }
        if annual_mismatch > 30:
            results["suspicious_patterns"].append(
                f"Annual report revenue differs from GST by {annual_mismatch:.1f}%"
            )
            results["verification_score"] -= 15

    # 4. Suspicious transaction patterns
    debit_count = bank_data.get("debit_transaction_count", 0)
    credit_count = bank_data.get("credit_transaction_count", 0)
    if credit_count > 0 and debit_count > credit_count * 3:
        results["suspicious_patterns"].append(
            "Unusually high debit-to-credit transaction ratio"
        )
        results["verification_score"] -= 10

    avg_balance = bank_data.get("average_balance", 0)
    if avg_balance < 0:
        results["suspicious_patterns"].append("Negative average bank balance detected")
        results["verification_score"] -= 15

    results["verification_score"] = max(0, round(results["verification_score"]))
    return results
