from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.job import Job, JobRequirement, JobStatus
from app.models.organization import Organization, OrganizationMember, OrganizationRole
from app.schemas.job import JobCreate, JobUpdate, JobResponse, JobRequirementResponse
from app.api.deps import get_current_org_member, require_org_role
from app.services.audit_service import audit_service

router = APIRouter()

@router.post("/", response_model=JobResponse)
def create_job(
    job_in: JobCreate,
    member: OrganizationMember = Depends(require_org_role([OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.RECRUITER])),
    db: Session = Depends(get_db)
):
    job = Job(
        organization_id=member.organization_id,
        title=job_in.title,
        department=job_in.department,
        location=job_in.location,
        employment_type=job_in.employment_type,
        description=job_in.description,
        responsibilities=job_in.responsibilities,
        qualifications=job_in.qualifications,
        experience_level=job_in.experience_level,
        deadline=job_in.deadline,
        status=job_in.status
    )
    db.add(job)
    db.flush()

    for req_in in (job_in.requirements or []):
        req = JobRequirement(
            job_id=job.id,
            title=req_in.title,
            description=req_in.description,
            category=req_in.category
        )
        db.add(req)

    audit_service.log_action(
        db=db,
        organization_id=member.organization_id,
        user_id=member.user_id,
        action="job.created",
        entity_type="job",
        entity_id=job.id,
        details={"title": job.title, "status": job.status.value}
    )
    db.commit()
    db.refresh(job)

    res = JobResponse.model_validate(job)
    res.application_count = 0
    return res

@router.get("/", response_model=List[JobResponse])
def list_jobs(
    status: Optional[JobStatus] = Query(None),
    department: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    member: OrganizationMember = Depends(get_current_org_member),
    db: Session = Depends(get_db)
):
    # Enforces strict tenant isolation: only current organization's jobs
    query = db.query(Job).filter(Job.organization_id == member.organization_id)
    if status:
        query = query.filter(Job.status == status)
    if department:
        query = query.filter(Job.department.ilike(f"%{department}%"))
    if search:
        query = query.filter(Job.title.ilike(f"%{search}%"))

    jobs = query.order_by(Job.created_at.desc()).all()
    results = []
    for j in jobs:
        resp = JobResponse.model_validate(j)
        resp.application_count = len(j.applications)
        results.append(resp)
    return results

@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: str,
    member: OrganizationMember = Depends(get_current_org_member),
    db: Session = Depends(get_db)
):
    # Cross-tenant access protection
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.organization_id == member.organization_id
    ).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    resp = JobResponse.model_validate(job)
    resp.application_count = len(job.applications)
    return resp

@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: str,
    job_in: JobUpdate,
    member: OrganizationMember = Depends(require_org_role([OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.RECRUITER])),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.organization_id == member.organization_id
    ).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    for field, val in job_in.model_dump(exclude_unset=True).items():
        setattr(job, field, val)

    audit_service.log_action(
        db=db,
        organization_id=member.organization_id,
        user_id=member.user_id,
        action="job.updated",
        entity_type="job",
        entity_id=job.id,
        details={"status": job.status.value}
    )
    db.commit()
    db.refresh(job)

    resp = JobResponse.model_validate(job)
    resp.application_count = len(job.applications)
    return resp

@router.delete("/{job_id}")
def delete_job(
    job_id: str,
    member: OrganizationMember = Depends(require_org_role([OrganizationRole.OWNER, OrganizationRole.ADMIN])),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.organization_id == member.organization_id
    ).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}

# Public Candidate Portal endpoints
@router.get("/portal/{org_slug}/list", response_model=List[JobResponse])
def public_portal_jobs(org_slug: str, db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.slug == org_slug).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    jobs = db.query(Job).filter(
        Job.organization_id == org.id,
        Job.status == JobStatus.PUBLISHED
    ).order_by(Job.created_at.desc()).all()

    return [JobResponse.model_validate(j) for j in jobs]

@router.get("/portal/{org_slug}/job/{job_id}", response_model=JobResponse)
def public_portal_job_detail(org_slug: str, job_id: str, db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.slug == org_slug).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    job = db.query(Job).filter(
        Job.id == job_id,
        Job.organization_id == org.id,
        Job.status == JobStatus.PUBLISHED
    ).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    return JobResponse.model_validate(job)

