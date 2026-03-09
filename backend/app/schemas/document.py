from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
from app.models.document import DocumentType, DocumentStatus


class DocumentResponse(BaseModel):
    id: int
    application_id: int
    document_type: DocumentType
    file_name: str
    file_size: Optional[int]
    mime_type: Optional[str]
    status: DocumentStatus
    extracted_data: Optional[Any]
    created_at: datetime

    class Config:
        from_attributes = True
