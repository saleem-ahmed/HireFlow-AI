from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.organization import Organization, OrganizationMember
from app.models.job import Job
from app.models.application import Application
from app.models.user import User
from app.schemas.analytics import SuperadminOrgStats
from app.api.deps import get_current_superadmin

router = APIRouter()

@router.get("/organizations", response_model=List[SuperadminOrgStats])
def list_all_organizations(
    superadmin: User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    orgs = db.query(Organization).order_by(Organization.created_at.desc()).all()
    results = []
    for o in orgs:
        member_cnt = db.query(OrganizationMember).filter(OrganizationMember.organization_id == o.id).count()
        job_cnt = db.query(Job).filter(Job.organization_id == o.id).count()
        app_cnt = db.query(Application).filter(Application.organization_id == o.id).count()

        results.append(SuperadminOrgStats(
            id=o.id,
            name=o.name,
            slug=o.slug,
            status=o.status.value,
            subscription_plan=o.subscription_plan,
            member_count=member_cnt,
            job_count=job_cnt,
            application_count=app_cnt,
            created_at=o.created_at.isoformat()
        ))
    return results

@router.patch("/organizations/{org_id}/status")
def update_org_status(
    org_id: str,
    status_str: str,
    superadmin: User = Depends(get_current_superadmin),
    db: Session = Depends(get_db)
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    from app.models.organization import OrganizationStatus
    try:
        org.status = OrganizationStatus(status_str)
        db.commit()
        return {"success": True, "status": org.status.value}
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status {status_str}")

