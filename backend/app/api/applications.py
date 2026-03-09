from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.application import LoanApplication, ApplicationStatus
from app.schemas.application import (
    LoanApplicationCreate, LoanApplicationUpdate,
    LoanApplicationResponse, ApplicationListResponse,
)

router = APIRouter(prefix="/api/applications", tags=["Loan Applications"])


@router.post("/", response_model=LoanApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    data: LoanApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.APPLICANT)),
):
    app = LoanApplication(
        applicant_id=current_user.id,
        company_name=data.company_name,
        cin_number=data.cin_number,
        gst_number=data.gst_number,
        industry_sector=data.industry_sector,
        requested_loan_amount=data.requested_loan_amount,
        business_description=data.business_description,
        status=ApplicationStatus.SUBMITTED.value,
    )
    db.add(app)
    await db.flush()
    await db.refresh(app)
    return LoanApplicationResponse.model_validate(app)


@router.get("/my", response_model=List[ApplicationListResponse])
async def get_my_applications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.APPLICANT)),
):
    result = await db.execute(
        select(LoanApplication)
        .where(LoanApplication.applicant_id == current_user.id)
        .order_by(LoanApplication.created_at.desc())
    )
    return [ApplicationListResponse.model_validate(a) for a in result.scalars().all()]


@router.get("/all", response_model=List[ApplicationListResponse])
async def get_all_applications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.BANK_OFFICER)),
):
    result = await db.execute(
        select(LoanApplication).order_by(LoanApplication.created_at.desc())
    )
    return [ApplicationListResponse.model_validate(a) for a in result.scalars().all()]


@router.get("/{application_id}", response_model=LoanApplicationResponse)
async def get_application(
    application_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(LoanApplication).where(LoanApplication.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if current_user.role == UserRole.APPLICANT and app.applicant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return LoanApplicationResponse.model_validate(app)


@router.patch("/{application_id}", response_model=LoanApplicationResponse)
async def update_application(
    application_id: int,
    data: LoanApplicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(LoanApplication).where(LoanApplication.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Applicants can only update their own draft/submitted apps
    if current_user.role == UserRole.APPLICANT:
        if app.applicant_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        if data.status and data.status not in [ApplicationStatus.SUBMITTED]:
            raise HTTPException(status_code=403, detail="Cannot change status")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(app, key, value)

    await db.flush()
    await db.refresh(app)
    return LoanApplicationResponse.model_validate(app)


# Delete endpoint for applicants to delete their own applications
@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.APPLICANT)),
):
    result = await db.execute(
        select(LoanApplication).where(LoanApplication.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.applicant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    await db.delete(app)
    await db.flush()
    return None
