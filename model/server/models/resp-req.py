from typing import Optional, List

from pydantic import BaseModel

from server.models import Book


class ValidationResult(BaseModel):
    task_id: str
    ok: bool
    invalid: Optional[List[Book]] = None
