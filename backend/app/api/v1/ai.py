from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.application import Application, ApplicationEvent
from app.models.ai import MatchAssessment, RecruiterSummary
from app.models.organization import OrganizationMember, OrganizationRole
from app.schemas.ai import (
    MatchAssessmentResponse, MatchAssessmentUpdate,
    RecruiterSummaryResponse, RecruiterSummaryUpdate
)
from app.api.deps import get_current_org_member, require_org_role
from app.services.audit_service import audit_service
from app.services.gemini_service import gemini_service

router = APIRouter()

@router.put("/assessment/{assessment_id}/override", response_model=MatchAssessmentResponse)
def override_assessment(
    assessment_id: str,
    update_in: MatchAssessmentUpdate,
    member: OrganizationMember = Depends(require_org_role([OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.RECRUITER])),
    db: Session = Depends(get_db)
):
    assessment = db.query(MatchAssessment).join(Application).filter(
        MatchAssessment.id == assessment_id,
        Application.organization_id == member.organization_id
    ).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    assessment.recruiter_overrides = update_in.recruiter_overrides
    assessment.is_reviewed_by_recruiter = "true" if update_in.is_reviewed else "false"

    event = ApplicationEvent(
        application_id=assessment.application_id,
        event_type="assessment_reviewed",
        details=f"Recruiter {member.user.full_name} reviewed and updated AI requirement assessment."
    )
    db.add(event)

    audit_service.log_action(
        db=db,
        organization_id=member.organization_id,
        user_id=member.user_id,
        action="assessment.override",
        entity_type="match_assessment",
        entity_id=assessment.id,
        details={"reviewed": True}
    )

    db.commit()
    db.refresh(assessment)
    return assessment

@router.put("/summary/{summary_id}/edit", response_model=RecruiterSummaryResponse)
def edit_recruiter_summary(
    summary_id: str,
    update_in: RecruiterSummaryUpdate,
    member: OrganizationMember = Depends(require_org_role([OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.RECRUITER])),
    db: Session = Depends(get_db)
):
    summary = db.query(RecruiterSummary).join(Application).filter(
        RecruiterSummary.id == summary_id,
        Application.organization_id == member.organization_id
    ).first()
    if not summary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not found")

    summary.recruiter_edited_summary = update_in.recruiter_edited_summary
    summary.is_edited_by_recruiter = "true"

    audit_service.log_action(
        db=db,
        organization_id=member.organization_id,
        user_id=member.user_id,
        action="summary.edited",
        entity_type="recruiter_summary",
        entity_id=summary.id
    )

    db.commit()
    db.refresh(summary)
    return summary

