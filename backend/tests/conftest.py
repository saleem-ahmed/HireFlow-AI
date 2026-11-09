import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.core.security import get_password_hash, create_access_token
from app.main import app
from app.models.user import User
from app.models.organization import Organization, OrganizationMember, OrganizationRole, OrganizationStatus
from app.models.job import Job, JobRequirement, JobStatus, RequirementCategory
from app.models.candidate import Candidate
from app.models.application import Application, ApplicationStatus, ApplicationSource

# In-memory SQLite for high-speed isolated testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_org_a(db):
    org = Organization(
        id="org-a-id",
        name="Alpha Corp",
        slug="alpha-corp",
        status=OrganizationStatus.ACTIVE
    )
    db.add(org)
    
    user_a = User(
        id="user-a-id",
        email="recruiter@alphacorp.com",
        full_name="Alice Recruiter",
        hashed_password=get_password_hash("Password123!"),
        is_active=True
    )
    db.add(user_a)
    
    member = OrganizationMember(
        id="member-a-id",
        organization_id=org.id,
        user_id=user_a.id,
        role=OrganizationRole.OWNER,
        is_active=True
    )
    db.add(member)
    db.commit()
    return {"org": org, "user": user_a, "member": member, "token": create_access_token(user_a.id)}

@pytest.fixture
def test_org_b(db):
    org = Organization(
        id="org-b-id",
        name="Beta Global",
        slug="beta-global",
        status=OrganizationStatus.ACTIVE
    )
    db.add(org)
    
    user_b = User(
        id="user-b-id",
        email="recruiter@betaglobal.com",
        full_name="Bob Recruiter",
        hashed_password=get_password_hash("Password123!"),
        is_active=True
    )
    db.add(user_b)
    
    member = OrganizationMember(
        id="member-b-id",
        organization_id=org.id,
        user_id=user_b.id,
        role=OrganizationRole.OWNER,
        is_active=True
    )
    db.add(member)
    db.commit()
    return {"org": org, "user": user_b, "member": member, "token": create_access_token(user_b.id)}

