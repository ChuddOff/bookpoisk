from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from client.models import Book


class GenerationRequest(BaseModel):
    books: List[Book]
    count: Optional[int] = 5


class GenerationResultRequest(BaseModel):
    task_id: str
    result: List[Book]
    generated_at: str = Field(default_factory=lambda: datetime.now().isoformat())