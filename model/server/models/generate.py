import uuid

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
from model.server.models import Book

class GenerationRequest(BaseModel):
    books: List[Book]
    count: Optional[int] = 5

class GenerationTaskResponse(BaseModel):
    status: str
    task_id: str

class GenerationResultRequest(BaseModel):
    task_id: str
    result: List[Book]
    generated_at: str = datetime.now(timezone.utc).isoformat()

class BackendGenerationRequest(BaseModel):
    userId: str | uuid.UUID
    books: List[Book]
    callbackUrl: str
    requestId: str | uuid.UUID
