import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.application import Application, ApplicationStatus, ApplicationSource, ApplicationEvent, RecruiterNote
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.organization import Organization, OrganizationMember, OrganizationRole
from app.models.document import ApplicationDocument, DocumentProcessingStatus
from app.schemas.application import (
    ApplicationResponse, ApplicationStatusUpdate, ApplicationAssignRecruiter,
    RecruiterNoteCreate, RecruiterNoteResponse
)
from app.api.deps import get_current_org_member, require_org_role
from app.services.audit_service import audit_service
from app.services.storage_service import get_storage_service
from app.services.document_parser import parser_service
from app.tasks.cv_tasks import process_document_pipeline_sync

router = APIRouter()

def build_app_response(app: Application) -> ApplicationResponse:
    res = ApplicationResponse.model_validate(app)
    res.job_title = app.job.title if app.job else "General Pool"
    res.assigned_recruiter_name = app.assigned_recruiter.full_name if app.assigned_recruiter else None
    
    # Latest assessment and summary
    if app.match_assessments:
        res.latest_assessment = app.match_assessments[-1]
    if app.recruiter_summaries:
        res.latest_summary = app.recruiter_summaries[-1]
    
    # Recruiter notes with author names
    notes_resp = []
    for n in app.notes:
        nr = RecruiterNoteResponse.model_validate(n)
        nr.author_name = n.author.full_name if n.author else "Recruiter"
        notes_resp.append(nr)
    res.notes = notes_resp

    return res

@router.get("/", response_model=List[ApplicationResponse])
def list_applications(
    job_id: Optional[str] = Query(None),
    status: Optional[ApplicationStatus] = Query(None),
    search: Optional[str] = Query(None),
    assigned_recruiter_id: Optional[str] = Query(None),
    member: OrganizationMember = Depends(get_current_org_member),
    db: Session = Depends(get_db)
):
    query = db.query(Application).filter(Application.organization_id == member.organization_id)
    if job_id:
        query = query.filter(Application.job_id == job_id)
    if status:
        query = query.filter(Application.status == status)
    if assigned_recruiter_id:
        query = query.filter(Application.assigned_recruiter_id == assigned_recruiter_id)
    if search:
        query = query.join(Candidate).filter(
            (Candidate.full_name.ilike(f"%{search}%")) |
            (Candidate.email.ilike(f"%{search}%"))
        )

    apps = query.order_by(Application.created_at.desc()).all()
    return [build_app_response(a) for a in apps]

@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: str,
    member: OrganizationMember = Depends(get_current_org_member),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(
        Application.id == application_id,
        Application.organization_id == member.organization_id
    ).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    return build_app_response(app)

@router.patch("/{application_id}/status", response_model=ApplicationResponse)
def update_application_status(
    application_id: str,
    status_in: ApplicationStatusUpdate,
    member: OrganizationMember = Depends(require_org_role([OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.RECRUITER])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(
        Application.id == application_id,
        Application.organization_id == member.organization_id
    ).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    old_status = app.status
    app.status = status_in.status

    event = ApplicationEvent(
        application_id=app.id,
        event_type="status_change",
        details=f"Status changed from {old_status.value} to {status_in.status.value} by {member.user.full_name}"
    )
    db.add(event)

    audit_service.log_action(
        db=db,
        organization_id=member.organization_id,
        user_id=member.user_id,
        action="application.status_changed",
        entity_type="application",
        entity_id=app.id,
        details={"from": old_status.value, "to": status_in.status.value}
    )

    db.commit()
    db.refresh(app)
    return build_app_response(app)

@router.post("/{application_id}/notes", response_model=RecruiterNoteResponse)
def add_recruiter_note(
    application_id: str,
    note_in: RecruiterNoteCreate,
    member: OrganizationMember = Depends(require_org_role([OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.RECRUITER, OrganizationRole.HIRING_MANAGER])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(
        Application.id == application_id,
        Application.organization_id == member.organization_id
    ).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    note = RecruiterNote(
        application_id=app.id,
        author_id=member.user_id,
        content=note_in.content
    )
    db.add(note)

    event = ApplicationEvent(
        application_id=app.id,
        event_type="note_added",
        details=f"Recruiter note added by {member.user.full_name}"
    )
    db.add(event)

    db.commit()
    db.refresh(note)

    res = RecruiterNoteResponse.model_validate(note)
    res.author_name = member.user.full_name
    return res

@router.patch("/{application_id}/assign", response_model=ApplicationResponse)
def assign_recruiter(
    application_id: str,
    assign_in: ApplicationAssignRecruiter,
    member: OrganizationMember = Depends(require_org_role([OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.RECRUITER])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(
        Application.id == application_id,
        Application.organization_id == member.organization_id
    ).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    app.assigned_recruiter_id = assign_in.recruiter_id
    event = ApplicationEvent(
        application_id=app.id,
        event_type="recruiter_assigned",
        details=f"Assigned to recruiter ID {assign_in.recruiter_id}"
    )
    db.add(event)
    db.commit()
    db.refresh(app)
    return build_app_response(app)

# Candidate Public Portal Application Submission
@router.post("/portal/{org_slug}/submit")
async def submit_application_portal(
    org_slug: str,
    job_id: str = Form(...),
    full_name: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    cover_letter: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    org = db.query(Organization).filter(Organization.slug == org_slug).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    job = db.query(Job).filter(Job.id == job_id, Job.organization_id == org.id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    # Read and validate CV file
    file_bytes = await file.read()
    is_valid, ext, err = parser_service.validate_file(file.filename, file.content_type, file_bytes)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err)

    # Find or create candidate within organization
    candidate = db.query(Candidate).filter(
        Candidate.organization_id == org.id,
        Candidate.email == email
    ).first()
    if not candidate:
        candidate = Candidate(
            organization_id=org.id,
            full_name=full_name,
            email=email,
            phone=phone
        )
        db.add(candidate)
        db.flush()

    # Create application
    application = Application(
        organization_id=org.id,
        job_id=job.id,
        candidate_id=candidate.id,
        status=ApplicationStatus.RECEIVED,
        source=ApplicationSource.WEBSITE,
        cover_letter=cover_letter
    )
    db.add(application)
    db.flush()

    # Save document
    doc_id = str(uuid.uuid4())
    storage = get_storage_service()
    storage_path, gdrive_id = storage.save_file(org.id, doc_id, file.filename, file_bytes)

    doc = ApplicationDocument(
        id=doc_id,
        application_id=application.id,
        file_name=file.filename,
        file_type=ext,
        mime_type=file.content_type or "application/octet-stream",
        file_size_bytes=len(file_bytes),
        storage_provider=storage.__class__.__name__,
        storage_path=storage_path,
        gdrive_file_id=gdrive_id,
        status=DocumentProcessingStatus.PENDING
    )
    db.add(doc)

    event = ApplicationEvent(
        application_id=application.id,
        event_type="application_received",
        details="Application submitted via Candidate Portal with CV attached."
    )
    db.add(event)
    db.commit()

    # Trigger processing pipeline
    try:
        process_document_pipeline_sync(doc.id)
    except Exception as e:
        pass

    return {
        "success": True,
        "application_id": application.id,
        "message": "Application submitted successfully! Your CV is being processed."
    }

