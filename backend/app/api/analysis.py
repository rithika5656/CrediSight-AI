"""
Analysis API: orchestrates document processing, cross-verification, research,
risk scoring, AI recommendation, and CAM generation.
"""
import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import require_role
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.application import LoanApplication, ApplicationStatus, RiskLevel
from app.models.document import Document, DocumentStatus
from app.services.document_analysis import extract_text, parse_financial_data
from app.services.financial_verification import cross_verify_financials
from app.services.research_agent import gather_research_insights
from app.services.risk_scoring import calculate_risk_score
from app.services.ai_recommendation import generate_recommendation
from app.services.cam_generator import generate_cam_pdf, generate_cam_docx

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])


@router.post("/{application_id}/analyze")
async def analyze_application(
    application_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.BANK_OFFICER)),
):
    """Run full analysis pipeline on an application."""
    result = await db.execute(
        select(LoanApplication).where(LoanApplication.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # 1. Process documents
    docs_result = await db.execute(
        select(Document).where(Document.application_id == application_id)
    )
    documents = docs_result.scalars().all()

    financial_data = {}
    for doc in documents:
        doc.status = DocumentStatus.PROCESSING.value
        await db.flush()

        try:
            text = extract_text(doc.file_path, doc.mime_type or "application/pdf")
            doc_type = doc.document_type if isinstance(doc.document_type, str) else doc.document_type.value
            parsed = parse_financial_data(text, doc_type)
            doc.extracted_text = text[:5000]  # Store first 5000 chars
            doc.extracted_data = parsed
            doc.status = DocumentStatus.PROCESSED.value
            financial_data[doc_type] = parsed
        except Exception as e:
            doc.status = DocumentStatus.FAILED.value
            doc.extracted_data = {"error": str(e)}

    app.financial_data = financial_data

    # 2. Cross-verify financials
    cross_verification = cross_verify_financials(financial_data)
    app.cross_verification_results = cross_verification

    # 3. Research agent
    research = await gather_research_insights(
        company_name=app.company_name,
        industry_sector=app.industry_sector,
        cin_number=app.cin_number,
    )
    app.research_insights = research

    # 4. Risk scoring (Five Cs)
    risk_result = calculate_risk_score(
        financial_data=financial_data,
        cross_verification=cross_verification,
        research_insights=research,
        requested_loan_amount=app.requested_loan_amount,
        industry_sector=app.industry_sector,
    )
    app.risk_score = risk_result["composite_score"]
    app.five_cs_evaluation = risk_result["five_cs"]

    risk_level_map = {"low": RiskLevel.LOW.value, "medium": RiskLevel.MEDIUM.value, "high": RiskLevel.HIGH.value, "critical": RiskLevel.CRITICAL.value}
    app.risk_level = risk_level_map.get(risk_result["risk_level"], RiskLevel.MEDIUM.value)

    # 5. AI recommendation
    recommendation = generate_recommendation(
        risk_score=risk_result["composite_score"],
        risk_level=risk_result["risk_level"],
        five_cs=risk_result["five_cs"],
        requested_amount=app.requested_loan_amount,
        financial_data=financial_data,
        cross_verification=cross_verification,
    )
    app.ai_recommendation = recommendation

    # 6. Update status
    app.status = ApplicationStatus.UNDER_REVIEW.value

    await db.flush()
    await db.refresh(app)

    return {
        "application_id": app.id,
        "status": app.status,
        "risk_score": app.risk_score,
        "risk_level": app.risk_level or None,
        "financial_data": financial_data,
        "cross_verification": cross_verification,
        "research_insights": research,
        "five_cs_evaluation": risk_result["five_cs"],
        "recommendation": recommendation,
    }


@router.post("/{application_id}/generate-cam")
async def generate_cam_report(
    application_id: int,
    format: str = "pdf",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.BANK_OFFICER)),
):
    """Generate CAM report for an analyzed application."""
    result = await db.execute(
        select(LoanApplication).where(LoanApplication.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if not app.risk_score:
        raise HTTPException(status_code=400, detail="Application must be analyzed first")

    cam_data = {
        "application": {
            "id": app.id,
            "company_name": app.company_name,
            "cin_number": app.cin_number,
            "gst_number": app.gst_number,
            "industry_sector": app.industry_sector,
            "requested_loan_amount": app.requested_loan_amount,
            "business_description": app.business_description,
            "created_at": str(app.created_at),
        },
        "financial_data": app.financial_data or {},
        "cross_verification": app.cross_verification_results or {},
        "risk_assessment": {
            "composite_score": app.risk_score,
            "risk_level": app.risk_level or "medium",
            "five_cs": app.five_cs_evaluation or {},
        },
        "recommendation": app.ai_recommendation or {},
    }

    reports_dir = os.path.join(settings.UPLOAD_DIR, "reports")

    if format == "docx":
        output_path = os.path.join(reports_dir, f"CAM_{application_id}.docx")
        generate_cam_docx(cam_data, output_path)
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    else:
        output_path = os.path.join(reports_dir, f"CAM_{application_id}.pdf")
        generate_cam_pdf(cam_data, output_path)
        media_type = "application/pdf"

    app.cam_report_path = output_path
    await db.flush()

    return FileResponse(
        path=output_path,
        media_type=media_type,
        filename=os.path.basename(output_path),
    )


@router.post("/{application_id}/decide")
async def decide_application(
    application_id: int,
    decision: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.BANK_OFFICER)),
):
    """Approve or reject an application."""
    if decision not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="Decision must be 'approve' or 'reject'")

    result = await db.execute(
        select(LoanApplication).where(LoanApplication.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.status = ApplicationStatus.APPROVED.value if decision == "approve" else ApplicationStatus.REJECTED.value
    await db.flush()
    await db.refresh(app)

    return {"application_id": app.id, "status": app.status}
