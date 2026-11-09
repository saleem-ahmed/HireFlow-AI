from typing import Dict, Any, List
from pydantic import BaseModel

class DashboardStats(BaseModel):
    total_jobs: int
    active_jobs: int
    total_candidates: int
    total_applications: int
    applications_under_review: int
    shortlisted_candidates: int
    hired_candidates: int
    cvs_received: int
    cvs_processed: int
    cvs_pending: int
    cvs_failed: int
    status_distribution: Dict[str, int]
    recent_applications: List[Dict[str, Any]] = []

class SuperadminOrgStats(BaseModel):
    id: str
    name: str
    slug: str
    status: str
    subscription_plan: str
    member_count: int
    job_count: int
    application_count: int
    created_at: str

