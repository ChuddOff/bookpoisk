from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from client.models import Book


class GenerationRequest(BaseModel):
    books: List[Book]
    count: Optional[int] = 5


class GenerationResultRequest(BaseModel):
    task_id: str
    result: List[Book]
    generated_at: str = datetime