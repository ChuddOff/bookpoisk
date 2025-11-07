from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, Field


class Task(BaseModel):
    task_id: str
    status: str = "queued"
    created_at: str = datetime.now(timezone.utc).isoformat()
    completed_at: Optional[str] = None
    result: Optional[Any] = None
