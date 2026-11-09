from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict

class ExperienceItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    company: str
    role: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: Optional[str] = "false"
    description: Optional[str] = None

class EducationItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    institution: str
    degree: str
    field_of_study: Optional[str] = None
    start_year: Optional[str] = None
    end_year: Optional[str] = None

class SkillItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    skill_name: str
    years_experience: Optional[int] = None
    source_evidence: Optional[str] = None

class CandidateBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    professional_summary: Optional[str] = None

class CandidateCreate(CandidateBase):
    pass

class CandidateUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    professional_summary: Optional[str] = None
    experiences: Optional[List[ExperienceItem]] = None
    education: Optional[List[EducationItem]] = None
    skills: Optional[List[SkillItem]] = None

class CandidateResponse(CandidateBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    created_at: datetime
    updated_at: datetime
    experiences: List[ExperienceItem] = []
    education: List[EducationItem] = []
    skills: List[SkillItem] = []
