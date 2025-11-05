from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel

from server.models import GenerationRequest


@dataclass
class Task:
    task_id: str
    request: GenerationRequest
    result: Any = None
    status: str = "queued"
    created_at: datetime = datetime.now(timezone.utc)

    def to_dict(self) -> dict:
        return {
            "task_id": self.task_id,
            "request": self.request,
            "result": self.result,
            "status": self.status,
            "created_at": self.created_at
        }


class TaskResponse(BaseModel):
    task_id: str
    request: GenerationRequest
    result: Any = None
    status: str = "queued"
    created_at: datetime = None