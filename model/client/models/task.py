from datetime import datetime, timezone
from typing import Optional, Any

from pydantic import BaseModel

from client.models import GenerationRequest


class Task(BaseModel):
    task_id: str
    status: str = "queued"
    created_at: str = datetime.now(timezone.utc).isoformat()
    completed_at: Optional[str] = None
    request: Optional[GenerationRequest] = None
    result: Optional[Any] = None