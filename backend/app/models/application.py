import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class ApplicationStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(Integer, primary_key=True, index=True)
    applicant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_name = Column(String(255), nullable=False)
    cin_number = Column(String(50), nullable=False)
    gst_number = Column(String(50), nullable=False)
    industry_sector = Column(String(100), nullable=False)
    requested_loan_amount = Column(Float, nullable=False)
    business_description = Column(Text, nullable=True)
    status = Column(String(50), default=ApplicationStatus.DRAFT.value)
    risk_score = Column(Float, nullable=True)
    risk_level = Column(String(50), nullable=True)
    financial_data = Column(JSON, nullable=True)
    cross_verification_results = Column(JSON, nullable=True)
    research_insights = Column(JSON, nullable=True)
    five_cs_evaluation = Column(JSON, nullable=True)
    ai_recommendation = Column(JSON, nullable=True)
    cam_report_path = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    applicant = relationship("User", backref="applications")
    documents = relationship("Document", back_populates="application", cascade="all, delete-orphan")
