import base64
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.organization import Organization
from app.models.job import Job, JobStatus
from app.models.candidate import Candidate
from app.models.application import Application, ApplicationStatus, ApplicationSource, ApplicationEvent
from app.models.document import ApplicationDocument, DocumentProcessingStatus
from app.services.storage_service import get_storage_service
from app.services.document_parser import parser_service
from app.tasks.cv_tasks import process_document_pipeline_sync

router = APIRouter()

class EmailAttachment(BaseModel):
    filename: str
    content_type: str
    content_base64: str

class EmailIntakePayload(BaseModel):
    from_email: str
    from_name: Optional[str] = None
    subject: str
    body_text: Optional[str] = None
    organization_slug: str
    job_reference: Optional[str] = None  # Job title, ID, or slug
    attachments: List[EmailAttachment] = []

@router.post("/email-intake")
def receive_email_intake(
    payload: EmailIntakePayload,
    x_hireflow_secret: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    # Verify secret if configured
    if settings.N8N_WEBHOOK_SECRET and x_hireflow_secret != settings.N8N_WEBHOOK_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook signature")

    org = db.query(Organization).filter(Organization.slug == payload.organization_slug).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target organization not found")

    # Match job if referenced in subject or explicit field
    job = None
    if payload.job_reference:
        job = db.query(Job).filter(
            Job.organization_id == org.id,
            (Job.id == payload.job_reference) | (Job.title.ilike(f"%{payload.job_reference}%"))
        ).first()

    if not job:
        # Try matching words in email subject against published job titles
        published_jobs = db.query(Job).filter(
            Job.organization_id == org.id,
            Job.status == JobStatus.PUBLISHED
        ).all()
        for j in published_jobs:
            if j.title.lower() in payload.subject.lower():
                job = j
                break

    # Get or create candidate
    candidate_name = payload.from_name or payload.from_email.split("@")[0].replace(".", " ").title()
    candidate = db.query(Candidate).filter(
        Candidate.organization_id == org.id,
        Candidate.email == payload.from_email
    ).first()

    if not candidate:
        candidate = Candidate(
            organization_id=org.id,
            full_name=candidate_name,
            email=payload.from_email
        )
        db.add(candidate)
        db.flush()

    # Create application
    application = Application(
        organization_id=org.id,
        job_id=job.id if job else None,
        candidate_id=candidate.id,
        status=ApplicationStatus.RECEIVED,
        source=ApplicationSource.RECRUITMENT_EMAIL,
        cover_letter=payload.body_text
    )
    db.add(application)
    db.flush()

    event = ApplicationEvent(
        application_id=application.id,
        event_type="email_intake",
        details=f"Application received via email from {payload.from_email}. Subject: '{payload.subject}'"
    )
    db.add(event)

    # Process CV attachments
    storage = get_storage_service()
    processed_docs = []

    for att in payload.attachments:
        try:
            file_bytes = base64.b64decode(att.content_base64)
            is_valid, ext, err = parser_service.validate_file(att.filename, att.content_type, file_bytes)
            if not is_valid:
                continue

            doc_id = str(uuid.uuid4())
            storage_path, gdrive_id = storage.save_file(org.id, doc_id, att.filename, file_bytes)

            doc = ApplicationDocument(
                id=doc_id,
                application_id=application.id,
                file_name=att.filename,
                file_type=ext,
                mime_type=att.content_type,
                file_size_bytes=len(file_bytes),
                storage_provider=storage.__class__.__name__,
                storage_path=storage_path,
                gdrive_file_id=gdrive_id,
                status=DocumentProcessingStatus.PENDING
            )
            db.add(doc)
            db.flush()
            processed_docs.append(doc.id)
        except Exception:
            continue

    db.commit()

    # Run processing pipeline for attachments
    for doc_id in processed_docs:
        try:
            process_document_pipeline_sync(doc_id)
        except Exception:
            pass

    return {
        "success": True,
        "application_id": application.id,
        "job_id": job.id if job else None,
        "documents_processed": len(processed_docs)
    }

