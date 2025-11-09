from ..database import book_exists_in_db
from ..models import Book


def validate_answer(answer: str) -> bool:
    ...

def validate_book(book: Book) -> bool:
    return book_exists_in_db(book)