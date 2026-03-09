# CrediSight AI -- Corporate Credit Decisioning Platform

A full-stack AI-powered system for banks to evaluate corporate loan applications and generate Credit Appraisal Memos (CAM).

## Tech Stack

- **Frontend:** React.js + Tailwind CSS + Lucide Icons
- **Backend:** FastAPI (Python) + SQLAlchemy (async)
- **Database:** PostgreSQL
- **Reports:** ReportLab (PDF) + python-docx (Word)
- **OCR:** PyTesseract + pdf2image

## Project Structure

```
CredFlow AI/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py                    # FastAPI application entry point
│       ├── core/
│       │   ├── config.py              # Settings & environment variables
│       │   ├── database.py            # Async SQLAlchemy engine & session
│       │   └── security.py            # JWT auth, password hashing, role guards
│       ├── models/
│       │   ├── user.py                # User model (applicant / bank_officer)
│       │   ├── application.py         # LoanApplication model
│       │   └── document.py            # Document model
│       ├── schemas/
│       │   ├── user.py                # Pydantic schemas for auth
│       │   ├── application.py         # Pydantic schemas for applications
│       │   └── document.py            # Pydantic schemas for documents
│       ├── api/
│       │   ├── auth.py                # /api/auth/* endpoints
│       │   ├── applications.py        # /api/applications/* endpoints
│       │   ├── documents.py           # /api/documents/* endpoints
│       │   ├── dashboard.py           # /api/dashboard/* endpoints
│       │   └── analysis.py            # /api/analysis/* (full pipeline)
│       └── services/
│           ├── document_analysis.py   # PDF/OCR text extraction & parsing
│           ├── financial_verification.py  # Cross-verification logic
│           ├── research_agent.py      # External data gathering
│           ├── risk_scoring.py        # Five Cs credit scoring (0-100)
│           ├── ai_recommendation.py   # Loan decision engine
│           └── cam_generator.py       # CAM PDF & Word generation
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── context/
        │   └── AuthContext.jsx
        ├── services/
        │   └── api.js
        ├── components/
        │   ├── Layout.jsx
        │   ├── ProtectedRoute.jsx
        │   └── UI.jsx
        └── pages/
            ├── auth/
            │   ├── Login.jsx
            │   └── Register.jsx
            ├── applicant/
            │   ├── Dashboard.jsx
            │   ├── LoanApplicationForm.jsx
            │   ├── MyApplications.jsx
            │   └── ApplicationDetail.jsx
            └── officer/
                ├── Dashboard.jsx
                ├── Applications.jsx
                └── ApplicationDetail.jsx
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user (applicant or officer) |
| POST | `/api/auth/login` | Login and receive JWT token |
| GET | `/api/auth/me` | Get current user profile |

### Loan Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/applications/` | Create new application (applicant) |
| GET | `/api/applications/my` | List applicant's applications |
| GET | `/api/applications/all` | List all applications (officer) |
| GET | `/api/applications/{id}` | Get application details |
| PATCH | `/api/applications/{id}` | Update application |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload document (PDF/image) |
| GET | `/api/documents/{application_id}` | List documents for application |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Dashboard statistics (officer) |

### Analysis Pipeline
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis/{id}/analyze` | Run full analysis pipeline |
| POST | `/api/analysis/{id}/generate-cam` | Generate CAM report (PDF/Word) |
| POST | `/api/analysis/{id}/decide` | Approve or reject application |

## Database Schema

### Users
- `id` (PK), `email` (unique), `hashed_password`, `full_name`, `company_name`, `role` (applicant/bank_officer), timestamps

### Loan Applications
- `id` (PK), `applicant_id` (FK), `company_name`, `cin_number`, `gst_number`, `industry_sector`, `requested_loan_amount`, `business_description`, `status`, `risk_score`, `risk_level`, `financial_data` (JSON), `cross_verification_results` (JSON), `research_insights` (JSON), `five_cs_evaluation` (JSON), `ai_recommendation` (JSON), `cam_report_path`, timestamps

### Documents
- `id` (PK), `application_id` (FK), `document_type`, `file_name`, `file_path`, `file_size`, `mime_type`, `status`, `extracted_text`, `extracted_data` (JSON), timestamp

## Setup Instructions

### Quick Start with Docker

```bash
docker compose up --build
```

Access: Frontend at http://localhost:3000, API at http://localhost:8000

### Manual Setup

#### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env           # Edit database credentials
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### PostgreSQL
Create the database:
```sql
CREATE DATABASE credisight;
```

Tables are auto-created on backend startup.

## Analysis Pipeline

1. **Document Processing** -- Extract text from PDFs/images (OCR for scanned docs)
2. **Financial Parsing** -- Convert extracted text to structured JSON per document type
3. **Cross-Verification** -- Compare GST revenue vs bank credits, detect mismatches
4. **Research Agent** -- Gather sector risk, news, MCA compliance, litigation data
5. **Risk Scoring** -- Five Cs of Credit evaluation (Character, Capacity, Capital, Collateral, Conditions)
6. **AI Recommendation** -- Approve/Reject decision with explainable reasoning
7. **CAM Generation** -- Structured Credit Appraisal Memo as PDF or Word document

## User Roles

- **Applicant:** Sign up, create loan applications, upload documents, track status, download CAM
- **Bank Officer:** View all applications, run analysis, review risk scores, approve/reject, generate CAM reports
