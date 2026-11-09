from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.job import JobStatus, RequirementCategory

class JobRequirementBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: RequirementCategory = RequirementCategory.ESSENTIAL

class JobRequirementCreate(JobRequirementBase):
    pass

class JobRequirementResponse(JobRequirementBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    job_id: str
    created_at: datetime

class JobBase(BaseModel):
    title: str
    department: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = "Full-time"
    description: str
    responsibilities: Optional[str] = None
    qualifications: Optional[str] = None
    experience_level: Optional[str] = None
    deadline: Optional[datetime] = None
    status: JobStatus = JobStatus.DRAFT

class JobCreate(JobBase):
    requirements: Optional[List[JobRequirementCreate]] = []

class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    description: Optional[str] = None
    responsibilities: Optional[str] = None
    qualifications: Optional[str] = None
    experience_level: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[JobStatus] = None

class JobResponse(JobBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    created_at: datetime
    updated_at: datetime
    requirements: List[JobRequirementResponse] = []
    application_count: Optional[int] = 0
