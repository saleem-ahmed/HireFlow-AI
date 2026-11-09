import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class JobStatus(str, enum.Enum):
    DRAFT = "Draft"
    PUBLISHED = "Published"
    PAUSED = "Paused"
    CLOSED = "Closed"
    ARCHIVED = "Archived"

class RequirementCategory(str, enum.Enum):
    ESSENTIAL = "Essential"
    PREFERRED = "Preferred"

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    department = Column(String(100), nullable=True)
    location = Column(String(100), nullable=True)
    employment_type = Column(String(50), default="Full-time")  # Full-time, Part-time, Contract, Remote
    description = Column(Text, nullable=False)
    responsibilities = Column(Text, nullable=True)
    qualifications = Column(Text, nullable=True)
    experience_level = Column(String(50), nullable=True)  # Junior, Mid, Senior, Lead
    deadline = Column(DateTime, nullable=True)
    status = Column(Enum(JobStatus), default=JobStatus.DRAFT, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="jobs")
    requirements = relationship("JobRequirement", back_populates="job", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="job")

class JobRequirement(Base):
    __tablename__ = "job_requirements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(Enum(RequirementCategory), default=RequirementCategory.ESSENTIAL, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    job = relationship("Job", back_populates="requirements")

