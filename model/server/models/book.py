from typing import TypedDict, Optional, List

from pydantic import BaseModel


class Book(TypedDict):
    """
    универсальный формат книги — используется и для сырых, и для сгенерированных данных
    """
    id: Optional[str]
    title: str
    author: Optional[str]
    year: Optional[int]
    description: Optional[str]
    genre: Optional[list[str]]
    cover: Optional[str]
    pages: Optional[int]


class BookPydantic(BaseModel):
    id: Optional[str]
    title: str
    author: Optional[str]
    year: Optional[int]
    description: Optional[str]
    genre: Optional[list[str]]
    cover: Optional[str]
    pages: Optional[int]


class GenerationRequest(BaseModel):
    books: List[BookPydantic]