from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime
from app.models.application import ApplicationStatus, RiskLevel


class LoanApplicationCreate(BaseModel):
    company_name: str
    cin_number: str
    gst_number: str
    industry_sector: str
    requested_loan_amount: float = Field(gt=0)
    business_description: Optional[str] = None


class LoanApplicationUpdate(BaseModel):
    company_name: Optional[str] = None
    cin_number: Optional[str] = None
    gst_number: Optional[str] = None
    industry_sector: Optional[str] = None
    requested_loan_amount: Optional[float] = None
    business_description: Optional[str] = None
    status: Optional[ApplicationStatus] = None


class LoanApplicationResponse(BaseModel):
    id: int
    applicant_id: int
    company_name: str
    cin_number: str
    gst_number: str
    industry_sector: str
    requested_loan_amount: float
    business_description: Optional[str]
    status: ApplicationStatus
    risk_score: Optional[float]
    risk_level: Optional[RiskLevel]
    financial_data: Optional[Any]
    cross_verification_results: Optional[Any]
    research_insights: Optional[Any]
    five_cs_evaluation: Optional[Any]
    ai_recommendation: Optional[Any]
    cam_report_path: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApplicationListResponse(BaseModel):
    id: int
    company_name: str
    industry_sector: str
    requested_loan_amount: float
    status: ApplicationStatus
    risk_score: Optional[float]
    risk_level: Optional[RiskLevel]
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_applications: int
    under_review: int
    high_risk: int
    cam_reports_generated: int
    approved: int
    rejected: int
