import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class DocumentProcessingStatus(str, enum.Enum):
    UPLOADED = "Uploaded"
    PENDING = "Pending"
    PROCESSING = "Processing"
    COMPLETED = "Completed"
    FAILED = "Failed"
    QUARANTINED = "Quarantined"
    REQUIRES_MANUAL_REVIEW = "Requires Manual Review"

class ApplicationDocument(Base):
    __tablename__ = "application_documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, docx, txt
    mime_type = Column(String(100), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    storage_provider = Column(String(50), default="local")  # local or gdrive
    storage_path = Column(String(500), nullable=False)
    gdrive_file_id = Column(String(255), nullable=True)
    status = Column(Enum(DocumentProcessingStatus), default=DocumentProcessingStatus.UPLOADED, nullable=False, index=True)
    parsed_text = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="documents")
    extraction_runs = relationship("ExtractionRun", back_populates="document", cascade="all, delete-orphan")

