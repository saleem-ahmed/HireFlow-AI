from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.job import Job, JobStatus
from app.models.candidate import Candidate
from app.models.application import Application, ApplicationStatus
from app.models.document import ApplicationDocument, DocumentProcessingStatus
from app.models.organization import OrganizationMember
from app.schemas.analytics import DashboardStats
from app.api.deps import get_current_org_member

router = APIRouter()

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_analytics(
    member: OrganizationMember = Depends(get_current_org_member),
    db: Session = Depends(get_db)
):
    org_id = member.organization_id

    # Jobs
    total_jobs = db.query(Job).filter(Job.organization_id == org_id).count()
    active_jobs = db.query(Job).filter(
        Job.organization_id == org_id,
        Job.status == JobStatus.PUBLISHED
    ).count()

    # Candidates & Applications
    total_candidates = db.query(Candidate).filter(Candidate.organization_id == org_id).count()
    total_applications = db.query(Application).filter(Application.organization_id == org_id).count()
    
    under_review = db.query(Application).filter(
        Application.organization_id == org_id,
        Application.status == ApplicationStatus.UNDER_REVIEW
    ).count()

    shortlisted = db.query(Application).filter(
        Application.organization_id == org_id,
        Application.status == ApplicationStatus.SHORTLISTED
    ).count()

    hired = db.query(Application).filter(
        Application.organization_id == org_id,
        Application.status == ApplicationStatus.HIRED
    ).count()

    # Documents
    doc_query = db.query(ApplicationDocument).join(Application).filter(Application.organization_id == org_id)
    cvs_received = doc_query.count()
    cvs_processed = doc_query.filter(ApplicationDocument.status == DocumentProcessingStatus.COMPLETED).count()
    cvs_pending = doc_query.filter(ApplicationDocument.status.in_([DocumentProcessingStatus.PENDING, DocumentProcessingStatus.PROCESSING])).count()
    cvs_failed = doc_query.filter(ApplicationDocument.status == DocumentProcessingStatus.FAILED).count()

    # Status distribution
    status_distribution = {}
    for st in ApplicationStatus:
        cnt = db.query(Application).filter(
            Application.organization_id == org_id,
            Application.status == st
        ).count()
        status_distribution[st.value] = cnt

    # Recent applications
    recent_apps = db.query(Application).filter(
        Application.organization_id == org_id
    ).order_by(Application.created_at.desc()).limit(5).all()

    recent_list = []
    for a in recent_apps:
        recent_list.append({
            "id": a.id,
            "candidate_name": a.candidate.full_name if a.candidate else "Unknown",
            "candidate_email": a.candidate.email if a.candidate else "",
            "job_title": a.job.title if a.job else "General Pool",
            "status": a.status.value,
            "created_at": a.created_at.isoformat()
        })

    return DashboardStats(
        total_jobs=total_jobs,
        active_jobs=active_jobs,
        total_candidates=total_candidates,
        total_applications=total_applications,
        applications_under_review=under_review,
        shortlisted_candidates=shortlisted,
        hired_candidates=hired,
        cvs_received=cvs_received,
        cvs_processed=cvs_processed,
        cvs_pending=cvs_pending,
        cvs_failed=cvs_failed,
        status_distribution=status_distribution,
        recent_applications=recent_list
    )

