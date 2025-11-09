from client.models import Book


def book_exists_in_db(title: str, author: str) -> bool:
    from client.database import get_cursor

    with get_cursor() as cursor:
        cursor.execute("SELECT 1 FROM books WHERE title = %s AND author = %s LIMIT 1", (title, author))
        return True if cursor.fetchone() else False


def fill_book_from_db(title: str, author: str):
    from client.database import get_cursor

    with get_cursor() as cursor:
        cursor.execute("SELECT id, title, author, year, description, genre, cover, pages FROM books WHERE title = %s AND author = %s", (title, author))
        print(cursor.fetchone())
