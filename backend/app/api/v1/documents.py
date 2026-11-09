import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.application import Application, ApplicationEvent
from app.models.document import ApplicationDocument, DocumentProcessingStatus
from app.models.organization import OrganizationMember, OrganizationRole
from app.schemas.application import DocumentResponse
from app.api.deps import get_current_org_member, require_org_role
from app.services.storage_service import get_storage_service
from app.services.document_parser import parser_service
from app.tasks.cv_tasks import process_document_pipeline_sync

router = APIRouter()

@router.post("/{application_id}/upload", response_model=DocumentResponse)
async def upload_document(
    application_id: str,
    file: UploadFile = File(...),
    member: OrganizationMember = Depends(require_org_role([OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.RECRUITER])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(
        Application.id == application_id,
        Application.organization_id == member.organization_id
    ).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    file_bytes = await file.read()
    is_valid, ext, err = parser_service.validate_file(file.filename, file.content_type, file_bytes)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err)

    doc_id = str(uuid.uuid4())
    storage = get_storage_service()
    storage_path, gdrive_id = storage.save_file(member.organization_id, doc_id, file.filename, file_bytes)

    doc = ApplicationDocument(
        id=doc_id,
        application_id=app.id,
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
        application_id=app.id,
        event_type="document_uploaded",
        details=f"Document {file.filename} uploaded by {member.user.full_name}"
    )
    db.add(event)
    db.commit()
    db.refresh(doc)

    # Trigger processing pipeline
    try:
        process_document_pipeline_sync(doc.id)
    except Exception:
        pass

    return doc

@router.get("/{document_id}/download")
def download_document(
    document_id: str,
    member: OrganizationMember = Depends(get_current_org_member),
    db: Session = Depends(get_db)
):
    doc = db.query(ApplicationDocument).join(Application).filter(
        ApplicationDocument.id == document_id,
        Application.organization_id == member.organization_id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    storage = get_storage_service()
    try:
        data = storage.get_file_bytes(doc.storage_path)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"File not found on storage: {e}")

    return Response(
        content=data,
        media_type=doc.mime_type,
        headers={"Content-Disposition": f"attachment; filename={doc.file_name}"}
    )

@router.post("/{document_id}/reprocess")
def reprocess_document(
    document_id: str,
    member: OrganizationMember = Depends(require_org_role([OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.RECRUITER])),
    db: Session = Depends(get_db)
):
    doc = db.query(ApplicationDocument).join(Application).filter(
        ApplicationDocument.id == document_id,
        Application.organization_id == member.organization_id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    result = process_document_pipeline_sync(doc.id)
    return result

