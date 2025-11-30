import uuid
from typing import Optional, List

from pydantic import BaseModel


class Book(BaseModel):
    id: str | uuid.UUID
    title: str
    author: Optional[str] = None
    genres: Optional[List[str]] = None
    description: Optional[str] = None
    year: Optional[int] = None
    cover: Optional[str] = None
    pages: Optional[int] = None
