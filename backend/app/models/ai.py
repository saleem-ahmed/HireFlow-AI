import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum, Float, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class RequirementEvidenceStatus(str, enum.Enum):
    EVIDENCED = "Evidenced"
    PARTIALLY_EVIDENCED = "Partially Evidenced"
    NOT_FOUND = "Not Found"
    UNCLEAR = "Unclear"

class ExtractionRun(Base):
    __tablename__ = "extraction_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("application_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    ai_provider = Column(String(50), default="Google Gemini")
    model_name = Column(String(100), default="gemini-1.5-flash")
    prompt_version = Column(String(50), default="v1.0")
    raw_response = Column(Text, nullable=True)
    structured_data = Column(JSON, nullable=True)
    status = Column(String(50), default="Completed")  # Completed, Failed, Retrying
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="extraction_runs")
    document = relationship("ApplicationDocument", back_populates="extraction_runs")

class MatchAssessment(Base):
    __tablename__ = "match_assessments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    model_name = Column(String(100), default="gemini-1.5-flash")
    overall_fit_summary = Column(Text, nullable=True)
    essential_requirements_met = Column(String(50), nullable=True)
    preferred_requirements_met = Column(String(50), nullable=True)
    # Stored as JSON array: list of criteria evaluation { requirement_id, title, category, status, explanation, cv_excerpt, page_number }
    criteria_assessments = Column(JSON, nullable=False, default=list)
    recruiter_overrides = Column(JSON, nullable=True)  # Human recruiter corrections
    is_reviewed_by_recruiter = Column(String(10), default="false")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="match_assessments")

class RecruiterSummary(Base):
    __tablename__ = "recruiter_summaries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_overview = Column(Text, nullable=False)
    key_strengths = Column(JSON, nullable=False, default=list)
    potential_gaps = Column(JSON, nullable=False, default=list)
    suggested_interview_questions = Column(JSON, nullable=False, default=list)
    recruiter_edited_summary = Column(Text, nullable=True)
    is_edited_by_recruiter = Column(String(10), default="false")
    model_name = Column(String(100), default="gemini-1.5-flash")
    prompt_version = Column(String(50), default="v1.0")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="recruiter_summaries")

