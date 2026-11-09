from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.application import ApplicationStatus, ApplicationSource
from app.models.document import DocumentProcessingStatus
from app.schemas.candidate import CandidateResponse
from app.schemas.ai import MatchAssessmentResponse, RecruiterSummaryResponse

class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    file_name: str
    file_type: str
    mime_type: str
    file_size_bytes: int
    status: DocumentProcessingStatus
    storage_provider: str
    created_at: datetime

class RecruiterNoteCreate(BaseModel):
    content: str

class RecruiterNoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str
    author_id: Optional[str] = None
    author_name: Optional[str] = None
    content: str
    created_at: datetime

class ApplicationEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str
    event_type: str
    details: Optional[str] = None
    created_at: datetime

class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus

class ApplicationAssignRecruiter(BaseModel):
    recruiter_id: Optional[str] = None

class ApplicationSubmitPublic(BaseModel):
    job_id: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    cover_letter: Optional[str] = None

class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    job_id: Optional[str] = None
    job_title: Optional[str] = None
    candidate_id: str
    status: ApplicationStatus
    source: ApplicationSource
    cover_letter: Optional[str] = None
    assigned_recruiter_id: Optional[str] = None
    assigned_recruiter_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    candidate: Optional[CandidateResponse] = None
    documents: List[DocumentResponse] = []
    notes: List[RecruiterNoteResponse] = []
    events: List[ApplicationEventResponse] = []
    latest_assessment: Optional[MatchAssessmentResponse] = None
    latest_summary: Optional[RecruiterSummaryResponse] = None
