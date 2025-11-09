from model.server.models import Book


def book_exists_in_db(book: Book) -> bool:
    from server.database import get_cursor

    with get_cursor() as cursor:
        cursor.execute("SELECT 1 FROM books WHERE title = %s AND author = %s LIMIT 1", (book["title"], book["author"]))
        return True if cursor.fetchone() else False