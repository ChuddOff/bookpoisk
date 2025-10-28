import os

from config import CHECKPOINT
from .connection import get_cursor
from models import Book


def save_book_to_db(raw_book: Book) -> None:
    """
    Записывает книгу в бд
    :param raw_book: сгенеренная и отформатированная книга
    """
    from utils import log_error

    try:
        with get_cursor() as cursor:

            # проверка на наличие такого экземпляра в бд
            cursor.execute(
                "SELECT 1 FROM books WHERE title = %s AND author = %s LIMIT 1",
                (raw_book["title"], raw_book["author"]))

            if cursor.fetchone():
                return

            # попытка записи в бд
            cursor.execute("""
                INSERT INTO books (id, title, author, pages, year, description, cover)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (
                raw_book["id"], raw_book["title"], raw_book["author"],
                int(raw_book["pages"]) if raw_book["pages"] else None,
                raw_book["year"], raw_book["description"], raw_book["cover"]
            ))

            genres = raw_book["genre"]
            if isinstance(genres, str):
                genres = [genres]

            for genre in genres:
                cursor.execute("""
                    INSERT INTO book_genres (book_id, genre)
                    VALUES (%s, %s)
                    ON CONFLICT DO NOTHING
                """, (raw_book["id"], genre))

    except Exception as e:
        log_error(f"DATABASE SAVE ERROR: {e}")


def load_checkpoint() -> int:
    if not os.path.exists(CHECKPOINT):
        return 0

    with open(CHECKPOINT, "r", encoding="utf-8") as file:
        return int(file.read().strip() or 0)


def save_checkpoint(index: int) -> None:
    with open(CHECKPOINT, "w", encoding="utf-8") as file:
        file.write(str(index))
