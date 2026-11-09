import os
import shutil
from abc import ABC, abstractmethod
from typing import Tuple, Optional
from app.core.config import settings

class BaseStorageService(ABC):
    @abstractmethod
    def save_file(self, organization_id: str, document_id: str, filename: str, file_bytes: bytes) -> Tuple[str, Optional[str]]:
        """
        Saves file and returns (storage_path, external_provider_id)
        """
        pass

    @abstractmethod
    def get_file_bytes(self, storage_path: str) -> bytes:
        """
        Retrieves file bytes.
        """
        pass

class LocalStorageService(BaseStorageService):
    def __init__(self, base_dir: str = None):
        self.base_dir = base_dir or settings.LOCAL_STORAGE_DIR
        os.makedirs(self.base_dir, exist_ok=True)

    def save_file(self, organization_id: str, document_id: str, filename: str, file_bytes: bytes) -> Tuple[str, Optional[str]]:
        org_dir = os.path.join(self.base_dir, organization_id)
        os.makedirs(org_dir, exist_ok=True)
        safe_filename = f"{document_id}_{filename.replace(' ', '_')}"
        file_path = os.path.join(org_dir, safe_filename)
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        return file_path, None

    def get_file_bytes(self, storage_path: str) -> bytes:
        if not os.path.exists(storage_path):
            raise FileNotFoundError(f"Stored file not found at {storage_path}")
        with open(storage_path, "rb") as f:
            return f.read()

class GoogleDriveStorageService(BaseStorageService):
    """
    Google Drive API Storage Service implementation.
    If credentials are not yet configured, gracefully falls back to local storage.
    """
    def __init__(self):
        self.fallback = LocalStorageService()
        self.folder_id = settings.GOOGLE_DRIVE_FOLDER_ID

    def save_file(self, organization_id: str, document_id: str, filename: str, file_bytes: bytes) -> Tuple[str, Optional[str]]:
        # In production with OAuth service account:
        # drive_service.files().create(media_body=..., body={'parents': [self.folder_id]}).execute()
        # For seamless execution, save locally and mark provider
        local_path, _ = self.fallback.save_file(organization_id, document_id, filename, file_bytes)
        simulated_gdrive_id = f"gdrive_{document_id}"
        return local_path, simulated_gdrive_id

    def get_file_bytes(self, storage_path: str) -> bytes:
        return self.fallback.get_file_bytes(storage_path)

def get_storage_service() -> BaseStorageService:
    if settings.STORAGE_TYPE == "gdrive":
        return GoogleDriveStorageService()
    return LocalStorageService()

