from typing import Optional

from pydantic import BaseModel


class Book(BaseModel):
    id: Optional[str] = None
    title: str
    author: Optional[str] = None
    year: Optional[int] = None
    description: Optional[str] = None
    genre: Optional[list] = None
    cover: Optional[str] = None
    pages: Optional[int] = None