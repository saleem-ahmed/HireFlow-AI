from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.organization import OrganizationRole, OrganizationStatus

class OrganizationBase(BaseModel):
    name: str
    logo_url: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    slug: Optional[str] = None

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    subscription_plan: Optional[str] = None

class OrganizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    logo_url: Optional[str] = None
    status: OrganizationStatus
    subscription_plan: str
    created_at: datetime

class MemberInvite(BaseModel):
    email: str
    role: OrganizationRole = OrganizationRole.RECRUITER

class MemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    user_id: str
    role: OrganizationRole
    is_active: bool
    email: Optional[str] = None
    full_name: Optional[str] = None
    created_at: datetime
