from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User, UserRole
from app.models.application import LoanApplication, ApplicationStatus, RiskLevel
from app.schemas.application import DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.BANK_OFFICER)),
):
    total = await db.execute(select(func.count(LoanApplication.id)))
    under_review = await db.execute(
        select(func.count(LoanApplication.id)).where(
            LoanApplication.status == ApplicationStatus.UNDER_REVIEW.value
        )
    )
    high_risk = await db.execute(
        select(func.count(LoanApplication.id)).where(
            LoanApplication.risk_level.in_([RiskLevel.HIGH.value, RiskLevel.CRITICAL.value])
        )
    )
    cam_generated = await db.execute(
        select(func.count(LoanApplication.id)).where(
            LoanApplication.cam_report_path.isnot(None)
        )
    )
    approved = await db.execute(
        select(func.count(LoanApplication.id)).where(
            LoanApplication.status == ApplicationStatus.APPROVED.value
        )
    )
    rejected = await db.execute(
        select(func.count(LoanApplication.id)).where(
            LoanApplication.status == ApplicationStatus.REJECTED.value
        )
    )

    return DashboardStats(
        total_applications=total.scalar() or 0,
        under_review=under_review.scalar() or 0,
        high_risk=high_risk.scalar() or 0,
        cam_reports_generated=cam_generated.scalar() or 0,
        approved=approved.scalar() or 0,
        rejected=rejected.scalar() or 0,
    )
