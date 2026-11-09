from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.organization import Organization, OrganizationMember, OrganizationRole
from app.models.user import User
from app.schemas.organization import (
    OrganizationResponse, OrganizationUpdate,
    MemberInvite, MemberResponse
)
from app.api.deps import get_current_org_member, require_org_role, get_current_user
from app.services.audit_service import audit_service
from app.core.security import get_password_hash

router = APIRouter()

@router.get("/current", response_model=OrganizationResponse)
def get_current_organization(
    member: OrganizationMember = Depends(get_current_org_member)
):
    return member.organization

@router.put("/current", response_model=OrganizationResponse)
def update_current_organization(
    org_in: OrganizationUpdate,
    member: OrganizationMember = Depends(require_org_role([OrganizationRole.OWNER, OrganizationRole.ADMIN])),
    db: Session = Depends(get_db)
):
    org = member.organization
    if org_in.name is not None:
        org.name = org_in.name
    if org_in.logo_url is not None:
        org.logo_url = org_in.logo_url
    if org_in.subscription_plan is not None:
        org.subscription_plan = org_in.subscription_plan

    audit_service.log_action(
        db=db,
        organization_id=org.id,
        user_id=member.user_id,
        action="organization.updated",
        details={"name": org.name}
    )
    db.commit()
    db.refresh(org)
    return org

@router.get("/members", response_model=List[MemberResponse])
def list_organization_members(
    member: OrganizationMember = Depends(get_current_org_member),
    db: Session = Depends(get_db)
):
    members = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == member.organization_id
    ).all()

    result = []
    for m in members:
        result.append(MemberResponse(
            id=m.id,
            organization_id=m.organization_id,
            user_id=m.user_id,
            role=m.role,
            is_active=m.is_active,
            email=m.user.email if m.user else None,
            full_name=m.user.full_name if m.user else None,
            created_at=m.created_at
        ))
    return result

@router.post("/members/invite", response_model=MemberResponse)
def invite_organization_member(
    invite_in: MemberInvite,
    member: OrganizationMember = Depends(require_org_role([OrganizationRole.OWNER, OrganizationRole.ADMIN])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == invite_in.email).first()
    if not user:
        # Create user account with a temporary password
        user = User(
            email=invite_in.email,
            full_name=invite_in.email.split("@")[0].title(),
            hashed_password=get_password_hash("HireflowTemp2026!"),
            is_active=True
        )
        db.add(user)
        db.flush()

    existing_member = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == member.organization_id,
        OrganizationMember.user_id == user.id
    ).first()

    if existing_member:
        existing_member.role = invite_in.role
        existing_member.is_active = True
        new_member = existing_member
    else:
        new_member = OrganizationMember(
            organization_id=member.organization_id,
            user_id=user.id,
            role=invite_in.role,
            is_active=True
        )
        db.add(new_member)

    audit_service.log_action(
        db=db,
        organization_id=member.organization_id,
        user_id=member.user_id,
        action="organization.member_invited",
        details={"email": user.email, "role": invite_in.role.value}
    )
    db.commit()
    db.refresh(new_member)

    return MemberResponse(
        id=new_member.id,
        organization_id=new_member.organization_id,
        user_id=new_member.user_id,
        role=new_member.role,
        is_active=new_member.is_active,
        email=user.email,
        full_name=user.full_name,
        created_at=new_member.created_at
    )

