import logging
import httpx
from typing import Dict, Any, Optional, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

class N8nAutomationService:
    @classmethod
    async def dispatch_event(cls, organization_id: str, event_name: str, payload: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Dispatches an event payload to n8n webhook endpoint with security headers.
        """
        if not settings.N8N_BASE_URL:
            logger.info(f"n8n not configured. Skipping dispatch for {event_name}")
            return True, "n8n_disabled"

        target_url = f"{settings.N8N_BASE_URL.rstrip('/')}/webhook/hireflow/{event_name}"
        headers = {
            "Content-Type": "application/json",
            "X-HireFlow-Secret": settings.N8N_WEBHOOK_SECRET,
            "X-Organization-ID": organization_id
        }
        body = {
            "event": event_name,
            "organization_id": organization_id,
            "data": payload
        }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(target_url, json=body, headers=headers)
                logger.info(f"Dispatched event {event_name} to n8n: HTTP {res.status_code}")
                return res.status_code in (200, 201, 204), res.text
        except Exception as e:
            logger.warning(f"Failed to dispatch event {event_name} to n8n: {e}")
            return False, str(e)

n8n_service = N8nAutomationService
