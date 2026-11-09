import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.models.organization import Organization, OrganizationMember, OrganizationRole
from app.schemas.auth import Token, UserLogin, UserRegister, UserResponse
from app.api.deps import get_current_user
from app.services.audit_service import audit_service

router = APIRouter()

def slugify(text: str) -> str:
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    return re.sub(r"[\s_-]+", "-", slug)

@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # 1. Create User
    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        is_active=True,
        is_superadmin=False
    )
    db.add(user)
    db.flush()

    # 2. Create Organization if specified or default
    org_name = user_in.organization_name or f"{user_in.full_name}'s Org"
    base_slug = slugify(org_name)
    slug = base_slug
    counter = 1
    while db.query(Organization).filter(Organization.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    org = Organization(
        name=org_name,
        slug=slug
    )
    db.add(org)
    db.flush()

    # 3. Add User as Organization Owner
    member = OrganizationMember(
        organization_id=org.id,
        user_id=user.id,
        role=OrganizationRole.OWNER,
        is_active=True
    )
    db.add(member)

    # Audit log
    audit_service.log_action(
        db=db,
        organization_id=org.id,
        user_id=user.id,
        action="auth.registered",
        details={"email": user.email, "org_name": org.name}
    )

    db.commit()

    token = create_access_token(subject=user.id)
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        organization_id=org.id,
        role=OrganizationRole.OWNER.value
    )

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated."
        )

    first_membership = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == user.id,
        OrganizationMember.is_active == True
    ).first()

    # If superadmin has no membership yet, attach to first available organization
    if not first_membership and user.is_superadmin:
        first_org = db.query(Organization).first()
        if first_org:
            first_membership = OrganizationMember(
                organization_id=first_org.id,
                user_id=user.id,
                role=OrganizationRole.OWNER,
                is_active=True
            )
            db.add(first_membership)
            db.commit()
            db.refresh(first_membership)

    org_id = first_membership.organization_id if first_membership else None
    role = first_membership.role.value if first_membership else None

    if org_id:
        audit_service.log_action(
            db=db,
            organization_id=org_id,
            user_id=user.id,
            action="auth.login",
            details={"email": user.email}
        )

    token = create_access_token(subject=user.id)
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        organization_id=org_id,
        role=role
    )

@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    memberships = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == current_user.id
    ).all()

    org_list = []
    for m in memberships:
        org_list.append({
            "organization_id": m.organization_id,
            "organization_name": m.organization.name,
            "organization_slug": m.organization.slug,
            "role": m.role.value,
            "is_active": m.is_active
        })

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_superadmin": current_user.is_superadmin,
        "memberships": org_list
    }

