from typing import List
from pydantic import BaseModel


class Book(BaseModel):
    id: str
    title: str
    author: str
    year: str
    description: str = ""
    genre: str
    tag: List[str] = []
    cover: str = ""
    photos: List[str] = []
    pages: int = 0


class Request(BaseModel):
    read_books: List[Book]
    all_books: List[Book]


class Response(BaseModel):
    recommended_books: List[Book]
