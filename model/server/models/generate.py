from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
from .book import Book

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
