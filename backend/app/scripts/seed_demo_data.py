import os
import random
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import async_session_factory
from app.models.application import LoanApplication, ApplicationStatus
from app.models.document import Document, DocumentStatus
from app.models.user import User, UserRole

INDUSTRIES = [
    "Agriculture", "Manufacturing", "Information Technology", "Retail", "Healthcare",
    "Construction", "Logistics", "Education", "Renewable Energy", "Food Processing"
]
BUSINESS_DESCRIPTIONS = [
    "Agricultural farm expansion for organic produce.",
    "IT cloud services company scaling operations.",
    "Manufacturing plant automation and robotics.",
    "Retail chain expansion into new cities.",
    "Healthcare clinic network growth.",
    "Construction of eco-friendly housing.",
    "Logistics fleet expansion and route optimization.",
    "EdTech platform for remote learning.",
    "Solar and wind energy project funding.",
    "Food processing plant modernization."
]
DOCUMENT_TYPES = [
    ("gst_filing", "gst_return.pdf"),
    ("bank_statement", "bank_statement.pdf"),
    ("income_tax_return", "itr_document.pdf")
]

STATUSES = (
    ["under_review"] * 10 +
    ["submitted"] * 10 +
    ["approved"] * 5 +
    ["rejected"] * 5
)

RISK_LEVELS = ["low", "medium", "high"]

DUMMY_PDF = b"%PDF-1.4\n%Dummy PDF file for testing\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000010 00000 n \ntrailer\n<< /Root 1 0 R >>\nstartxref\n50\n%%EOF"

UPLOAD_DIR = "uploads"

async def run():
    async with async_session_factory() as session:
        # Create a demo officer if not exists
        officer = await session.execute(select(User).where(User.email == "officer@demo.com"))
        officer = officer.scalar_one_or_none()
        if not officer:
            officer = User(
                email="officer@demo.com",
                hashed_password="$2b$12$abcdefghijklmnopqrstuv",  # dummy hash
                full_name="Demo Officer",
                role=UserRole.BANK_OFFICER.value,
                company_name="Demo Bank"
            )
            session.add(officer)
            await session.flush()

        today = datetime.now(timezone.utc)
        for i in range(30):
            industry = random.choice(INDUSTRIES)
            desc = random.choice(BUSINESS_DESCRIPTIONS)
            status = STATUSES[i]
            company = f"{industry} Solutions Pvt Ltd {i+1}"
            app = LoanApplication(
                applicant_id=1,  # Assume demo applicant
                company_name=company,
                cin_number=f"U{random.randint(10000,99999)}MH{random.randint(2000,2025)}PTC{random.randint(100000,999999)}",
                gst_number=f"{random.randint(10,99)}AAAAA{random.randint(1000,9999)}A1Z{random.randint(0,9)}",
                industry_sector=industry,
                requested_loan_amount=random.randint(3000000, 20000000),
                business_description=desc,
                status=status,
                risk_score=round(random.uniform(45, 85), 1) if status in ("under_review", "approved", "rejected") else None,
                risk_level=random.choice(RISK_LEVELS) if status in ("under_review", "approved", "rejected") else None,
                created_at=today - timedelta(days=random.randint(0, 60)),
                updated_at=today - timedelta(days=random.randint(0, 60)),
            )
            session.add(app)
            await session.flush()

            app_id = app.id
            app_upload_dir = os.path.join(UPLOAD_DIR, str(app_id))
            os.makedirs(app_upload_dir, exist_ok=True)
            for doc_type, fname in DOCUMENT_TYPES:
                file_path = os.path.join(app_upload_dir, fname)
                with open(file_path, "wb") as f:
                    f.write(DUMMY_PDF)
                doc = Document(
                    application_id=app_id,
                    document_type=doc_type,
                    file_name=fname,
                    file_path=file_path,
                    file_size=len(DUMMY_PDF),
                    mime_type="application/pdf",
                    status=DocumentStatus.PROCESSED.value,
                    created_at=app.created_at,
                )
                session.add(doc)
        await session.commit()
    print("Seeded 30 demo applications with documents.")
