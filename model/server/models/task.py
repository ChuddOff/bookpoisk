from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel

from model.server.models import GenerationRequest


class Task(BaseModel):
    task_id: str
    status: str = "queued"
    created_at: str = datetime.now(timezone.utc).isoformat()
    completed_at: Optional[str] = None
    request: Optional[GenerationRequest] = None
    result: Optional[Any] = None

    # новые поля:
    backend_callback: Optional[str] = None
    backend_request_id: Optional[str] = None
    backend_user_id: Optional[str] = None

