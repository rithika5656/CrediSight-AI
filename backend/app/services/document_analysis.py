"""
Document Analysis Service
Extracts text from PDFs and scanned images, parses financial data into structured JSON.
"""
import re
import json
from typing import Optional
from PyPDF2 import PdfReader

try:
    import pytesseract
    from PIL import Image
    from pdf2image import convert_from_path
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a standard PDF."""
    reader = PdfReader(file_path)
    text_parts = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text)
    return "\n".join(text_parts)


def extract_text_with_ocr(file_path: str) -> str:
    """Extract text from scanned PDF using OCR."""
    if not OCR_AVAILABLE:
        return ""
    try:
        images = convert_from_path(file_path)
        text_parts = []
        for img in images:
            text_parts.append(pytesseract.image_to_string(img))
        return "\n".join(text_parts)
    except Exception:
        return ""


def extract_text_from_image(file_path: str) -> str:
    """Extract text from an image file using OCR."""
    if not OCR_AVAILABLE:
        return ""
    try:
        img = Image.open(file_path)
        return pytesseract.image_to_string(img)
    except Exception:
        return ""


def extract_text(file_path: str, mime_type: str) -> str:
    """Main extraction dispatcher."""
    if mime_type == "application/pdf":
        text = extract_text_from_pdf(file_path)
        if len(text.strip()) < 50:
            ocr_text = extract_text_with_ocr(file_path)
            if len(ocr_text.strip()) > len(text.strip()):
                return ocr_text
        return text
    elif mime_type in ("image/png", "image/jpeg", "image/tiff"):
        return extract_text_from_image(file_path)
    return ""


def parse_financial_data(text: str, document_type: str) -> dict:
    """Parse extracted text into structured financial data based on document type."""
    data = {"raw_text_length": len(text), "document_type": document_type}

    if document_type == "gst_filing":
        data.update(_parse_gst_data(text))
    elif document_type == "income_tax_return":
        data.update(_parse_itr_data(text))
    elif document_type == "bank_statement":
        data.update(_parse_bank_statement(text))
    elif document_type == "annual_report":
        data.update(_parse_annual_report(text))
    elif document_type == "legal_document":
        data.update(_parse_legal_document(text))

    return data


def _extract_amounts(text: str) -> list:
    """Extract monetary amounts from text."""
    pattern = r'(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{2})?)'
    matches = re.findall(pattern, text, re.IGNORECASE)
    return [float(m.replace(",", "")) for m in matches]


def _parse_gst_data(text: str) -> dict:
    gst_match = re.search(r'\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]', text)
    amounts = _extract_amounts(text)
    turnover = max(amounts) if amounts else 0

    return {
        "gstin": gst_match.group() if gst_match else None,
        "reported_revenue": turnover,
        "tax_amounts": amounts[:10],
        "total_transactions": len(amounts),
    }


def _parse_itr_data(text: str) -> dict:
    amounts = _extract_amounts(text)
    pan_match = re.search(r'[A-Z]{5}\d{4}[A-Z]', text)

    return {
        "pan_number": pan_match.group() if pan_match else None,
        "gross_income": max(amounts) if amounts else 0,
        "tax_paid": min(amounts) if amounts else 0,
        "financial_amounts": amounts[:10],
    }


def _parse_bank_statement(text: str) -> dict:
    amounts = _extract_amounts(text)
    credit_keywords = ["credit", "deposit", "cr", "received"]
    debit_keywords = ["debit", "withdrawal", "dr", "paid"]

    text_lower = text.lower()
    credit_count = sum(text_lower.count(kw) for kw in credit_keywords)
    debit_count = sum(text_lower.count(kw) for kw in debit_keywords)

    total_credits = sum(amounts[:len(amounts)//2]) if amounts else 0
    total_debits = sum(amounts[len(amounts)//2:]) if amounts else 0

    return {
        "total_credits": total_credits,
        "total_debits": total_debits,
        "credit_transaction_count": credit_count,
        "debit_transaction_count": debit_count,
        "average_balance": (total_credits - total_debits) / 2 if amounts else 0,
        "transaction_amounts": amounts[:20],
    }


def _parse_annual_report(text: str) -> dict:
    amounts = _extract_amounts(text)

    return {
        "reported_revenue": max(amounts) if amounts else 0,
        "key_financials": amounts[:15],
        "has_audit_report": "audit" in text.lower(),
        "has_directors_report": "director" in text.lower(),
    }


def _parse_legal_document(text: str) -> dict:
    return {
        "has_litigation_mention": any(w in text.lower() for w in ["litigation", "lawsuit", "court", "dispute"]),
        "has_compliance_mention": any(w in text.lower() for w in ["compliance", "regulatory", "penalty"]),
        "has_mortgage_mention": any(w in text.lower() for w in ["mortgage", "collateral", "security"]),
    }
