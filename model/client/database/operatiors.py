from client.models import Book


def book_exists_in_db(title: str, author: str) -> bool:
    from client.database import get_cursor

    with get_cursor() as cursor:
        cursor.execute("SELECT 1 FROM books WHERE title = %s AND author = %s LIMIT 1", (title, author))
        return True if cursor.fetchone() else False


def fill_book_from_db(title: str, author: str):
    from client.database import get_cursor

    if not book_exists_in_db(title, author):
        return None

    with get_cursor() as cursor:

        cursor.execute("SELECT id, title, author, year, description, cover, pages FROM books "
                       "WHERE title = %s AND author = %s LIMIT 1", (title, author))
        row = cursor.fetchone()

        cursor.execute("SELECT genre FROM book_genres WHERE book_id = %s", (row[0],))
        row = row + tuple([[r[0] for r in cursor.fetchall()]])

        return Book(**dict(zip(["id", "title", "author", "year", "description", "cover", "pages", "genre"], row)))
