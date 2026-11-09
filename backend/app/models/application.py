import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base

class ApplicationStatus(str, enum.Enum):
    RECEIVED = "Received"
    PROCESSING = "Processing"
    UNDER_REVIEW = "Under Review"
    SHORTLISTED = "Shortlisted"
    INTERVIEW = "Interview"
    ON_HOLD = "On Hold"
    REJECTED = "Rejected"
    HIRED = "Hired"
    WITHDRAWN = "Withdrawn"

class ApplicationSource(str, enum.Enum):
    WEBSITE = "Website"
    RECRUITMENT_EMAIL = "Recruitment Email"
    MANUAL_UPLOAD = "Manual Upload"

class Application(Base):
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True, index=True)
    candidate_id = Column(String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.RECEIVED, nullable=False, index=True)
    source = Column(Enum(ApplicationSource), default=ApplicationSource.WEBSITE, nullable=False)
    cover_letter = Column(Text, nullable=True)
    assigned_recruiter_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    candidate = relationship("Candidate", back_populates="applications")
    assigned_recruiter = relationship("User", back_populates="assigned_applications")
    documents = relationship("ApplicationDocument", back_populates="application", cascade="all, delete-orphan")
    events = relationship("ApplicationEvent", back_populates="application", cascade="all, delete-orphan")
    notes = relationship("RecruiterNote", back_populates="application", cascade="all, delete-orphan")
    extraction_runs = relationship("ExtractionRun", back_populates="application", cascade="all, delete-orphan")
    match_assessments = relationship("MatchAssessment", back_populates="application", cascade="all, delete-orphan")
    recruiter_summaries = relationship("RecruiterSummary", back_populates="application", cascade="all, delete-orphan")

class ApplicationEvent(Base):
    __tablename__ = "application_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)  # status_change, document_uploaded, ai_processed, note_added, interview_scheduled
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="events")

class RecruiterNote(Base):
    __tablename__ = "recruiter_notes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="notes")
    author = relationship("User", back_populates="recruiter_notes")

