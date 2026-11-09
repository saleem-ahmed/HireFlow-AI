from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.organization import Organization, OrganizationMember, OrganizationRole
from app.schemas.auth import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user

def get_current_org_member(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    x_organization_id: Optional[str] = Header(None)
) -> OrganizationMember:
    """
    Validates that current user belongs to the active organization.
    Uses X-Organization-ID header, or picks the user's first active membership.
    """
    query = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.is_active == True
    )

    if x_organization_id:
        member = query.filter(OrganizationMember.organization_id == x_organization_id).first()
    else:
        member = query.first()

    if not member:
        # If user is a superadmin, grant access to the requested organization or the first available organization
        if current_user.is_superadmin:
            target_org = None
            if x_organization_id:
                target_org = db.query(Organization).filter(Organization.id == x_organization_id).first()
            if not target_org:
                target_org = db.query(Organization).first()

            if target_org:
                member = db.query(OrganizationMember).filter(
                    OrganizationMember.user_id == current_user.id,
                    OrganizationMember.organization_id == target_org.id
                ).first()
                if not member:
                    member = OrganizationMember(
                        organization_id=target_org.id,
                        user_id=current_user.id,
                        role=OrganizationRole.OWNER,
                        is_active=True
                    )
                    db.add(member)
                    db.commit()
                    db.refresh(member)
                return member

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have an active membership in this organization."
        )

    return member

def require_org_role(allowed_roles: list[OrganizationRole]):
    def role_checker(member: OrganizationMember = Depends(get_current_org_member)) -> OrganizationMember:
        if member.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action requires one of roles: {[r.value for r in allowed_roles]}"
            )
        return member
    return role_checker

def get_current_superadmin(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin privileges required."
        )
    return current_user

