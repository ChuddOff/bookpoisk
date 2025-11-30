from typing import Optional, List

from pydantic import BaseModel


class Book(BaseModel):
    bookId: str
    title: str
    author: Optional[str] = None
    year: Optional[int] = None
    description: Optional[str] = None
    genres: Optional[List[str]] = None
    coverUrl: Optional[str] = None
    pages: Optional[int] = None
