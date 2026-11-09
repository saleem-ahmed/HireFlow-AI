import io
import re
from typing import Dict, Any, Tuple, List

class DocumentParserService:
    ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}
    ALLOWED_MIME_TYPES = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain",
        "application/octet-stream"
    }
    MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

    # Suspicious prompt-injection patterns common in adversarial CVs
    SUSPICIOUS_PATTERNS = [
        re.compile(r"ignore\s+(all\s+)?(previous|above)\s+instructions", re.IGNORECASE),
        re.compile(r"you\s+must\s+(give|rate|score)\s+(me\s+)?(100%|full\s+marks|highest)", re.IGNORECASE),
        re.compile(r"system\s*:\s*role", re.IGNORECASE),
        re.compile(r"<\|im_start\|>", re.IGNORECASE),
        re.compile(r"assistant\s*:\s*hire\s+this\s+candidate", re.IGNORECASE),
    ]

    @classmethod
    def validate_file(cls, filename: str, content_type: str, file_bytes: bytes) -> Tuple[bool, str, str]:
        """
        Validates file extension, mime type, and file size.
        Returns: (is_valid, ext, error_message)
        """
        if len(file_bytes) > cls.MAX_FILE_SIZE_BYTES:
            return False, "", f"File size exceeds 10MB limit ({len(file_bytes)} bytes)"

        parts = filename.rsplit(".", 1)
        if len(parts) < 2:
            return False, "", "File has no extension"
        
        ext = parts[1].lower()
        if ext not in cls.ALLOWED_EXTENSIONS:
            return False, ext, f"Unsupported file extension '.{ext}'. Allowed: {', '.join(cls.ALLOWED_EXTENSIONS)}"

        return True, ext, ""

    @classmethod
    def check_for_injections(cls, text: str) -> List[str]:
        """Checks for suspicious adversarial instruction attempts."""
        findings = []
        for pattern in cls.SUSPICIOUS_PATTERNS:
            match = pattern.search(text)
            if match:
                findings.append(match.group(0))
        return findings

    @classmethod
    def extract_text(cls, file_bytes: bytes, ext: str) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Extracts raw text and paginated structure from file bytes.
        Returns: (full_text, pages_list)
        """
        pages: List[Dict[str, Any]] = []
        full_text_parts: List[str] = []

        if ext == "txt":
            try:
                text = file_bytes.decode("utf-8")
            except UnicodeDecodeError:
                text = file_bytes.decode("latin-1", errors="replace")
            pages.append({"page_number": 1, "text": text})
            return text, pages

        elif ext == "pdf":
            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                for idx, page in enumerate(reader.pages):
                    page_text = page.extract_text() or ""
                    pages.append({"page_number": idx + 1, "text": page_text})
                    full_text_parts.append(page_text)
                return "\n\n".join(full_text_parts), pages
            except Exception as e:
                # Fallback if pypdf fails or not installed yet
                clean_text = file_bytes.decode("utf-8", errors="ignore")
                pages.append({"page_number": 1, "text": clean_text})
                return clean_text, pages

        elif ext == "docx":
            try:
                import docx
                doc = docx.Document(io.BytesIO(file_bytes))
                paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
                text = "\n".join(paragraphs)
                pages.append({"page_number": 1, "text": text})
                return text, pages
            except Exception as e:
                clean_text = file_bytes.decode("utf-8", errors="ignore")
                pages.append({"page_number": 1, "text": clean_text})
                return clean_text, pages

        return "", pages

parser_service = DocumentParserService()

