from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.candidate import Candidate, CandidateExperience, CandidateEducation, CandidateSkill
from app.models.organization import OrganizationMember, OrganizationRole
from app.schemas.candidate import CandidateResponse, CandidateUpdate
from app.api.deps import get_current_org_member, require_org_role
from app.services.audit_service import audit_service

router = APIRouter()

@router.get("/", response_model=List[CandidateResponse])
def list_candidates(
    search: Optional[str] = Query(None),
    member: OrganizationMember = Depends(get_current_org_member),
    db: Session = Depends(get_db)
):
    # Enforce tenant isolation: scoped to member.organization_id
    query = db.query(Candidate).filter(Candidate.organization_id == member.organization_id)
    if search:
        query = query.filter(
            (Candidate.full_name.ilike(f"%{search}%")) |
            (Candidate.email.ilike(f"%{search}%")) |
            (Candidate.professional_summary.ilike(f"%{search}%"))
        )

    candidates = query.order_by(Candidate.created_at.desc()).all()
    return candidates

@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(
    candidate_id: str,
    member: OrganizationMember = Depends(get_current_org_member),
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id,
        Candidate.organization_id == member.organization_id
    ).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    return candidate

@router.put("/{candidate_id}", response_model=CandidateResponse)
def update_candidate(
    candidate_id: str,
    candidate_in: CandidateUpdate,
    member: OrganizationMember = Depends(require_org_role([OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.RECRUITER])),
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id,
        Candidate.organization_id == member.organization_id
    ).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    # Update basic profile fields
    data = candidate_in.model_dump(exclude_unset=True)
    for field in ["full_name", "email", "phone", "location", "linkedin_url", "portfolio_url", "professional_summary"]:
        if field in data and data[field] is not None:
            setattr(candidate, field, data[field])

    # Update experiences if supplied
    if candidate_in.experiences is not None:
        db.query(CandidateExperience).filter(CandidateExperience.candidate_id == candidate.id).delete()
        for exp in candidate_in.experiences:
            db.add(CandidateExperience(
                candidate_id=candidate.id,
                company=exp.company,
                role=exp.role,
                location=exp.location,
                start_date=exp.start_date,
                end_date=exp.end_date,
                is_current=exp.is_current,
                description=exp.description
            ))

    # Update education if supplied
    if candidate_in.education is not None:
        db.query(CandidateEducation).filter(CandidateEducation.candidate_id == candidate.id).delete()
        for edu in candidate_in.education:
            db.add(CandidateEducation(
                candidate_id=candidate.id,
                institution=edu.institution,
                degree=edu.degree,
                field_of_study=edu.field_of_study,
                start_year=edu.start_year,
                end_year=edu.end_year
            ))

    # Update skills if supplied
    if candidate_in.skills is not None:
        db.query(CandidateSkill).filter(CandidateSkill.candidate_id == candidate.id).delete()
        for sk in candidate_in.skills:
            db.add(CandidateSkill(
                candidate_id=candidate.id,
                skill_name=sk.skill_name,
                years_experience=sk.years_experience,
                source_evidence="Recruiter Verified"
            ))

    audit_service.log_action(
        db=db,
        organization_id=member.organization_id,
        user_id=member.user_id,
        action="candidate.updated_by_recruiter",
        entity_type="candidate",
        entity_id=candidate.id,
        details={"name": candidate.full_name}
    )

    db.commit()
    db.refresh(candidate)
    return candidate

