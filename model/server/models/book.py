from typing import TypedDict, Optional


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