from typing import Optional

from pydantic import BaseModel


class Book(BaseModel):
    title: str
    author: Optional[str] = None
    year: Optional[int] = None
    description: Optional[str] = None