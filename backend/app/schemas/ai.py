from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.ai import RequirementEvidenceStatus

class CriteriaAssessment(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    requirement_id: Optional[str] = None
    title: str
    category: str  # Essential or Preferred
    status: RequirementEvidenceStatus
    explanation: str
    cv_excerpt: Optional[str] = None
    page_number: Optional[int] = 1

class MatchAssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str
    job_id: str
    model_name: str
    overall_fit_summary: Optional[str] = None
    essential_requirements_met: Optional[str] = None
    preferred_requirements_met: Optional[str] = None
    criteria_assessments: List[CriteriaAssessment] = []
    recruiter_overrides: Optional[Dict[str, Any]] = None
    is_reviewed_by_recruiter: str
    created_at: datetime
    updated_at: datetime

class MatchAssessmentUpdate(BaseModel):
    recruiter_overrides: Dict[str, Any]
    is_reviewed: bool = True

class RecruiterSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str
    candidate_overview: str
    key_strengths: List[str] = []
    potential_gaps: List[str] = []
    suggested_interview_questions: List[str] = []
    recruiter_edited_summary: Optional[str] = None
    is_edited_by_recruiter: str
    model_name: str
    created_at: datetime

class RecruiterSummaryUpdate(BaseModel):
    recruiter_edited_summary: str

class ExtractedCandidateData(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    professional_summary: Optional[str] = None
    skills: List[str] = []
    experiences: List[Dict[str, Any]] = []
    education: List[Dict[str, Any]] = []
    certifications: List[str] = []
    projects: List[str] = []
    missing_or_unclear_info: List[str] = []
