# services/book_repository.py
from typing import List, Dict, Any, Iterable
import psycopg2
import os
import logging

from model.server.models import Book

log = logging.getLogger(__name__)


class BookRepository:
    def get_all_books(self) -> List[Dict[str, Any]]:
        raise NotImplementedError

    def get_genres_for_titles(self, titles_and_authors: Iterable[Dict[str, str]]) -> Dict[str, List[str]]:
        raise NotImplementedError


class DBBookRepository(BookRepository):
    """
    PostgreSQL репозиторий книг.
    Ожидается, что в БД есть таблицы:
      - books(id, title, author, year, description)
      - book_genres(book_id, genre)   <-- имя таблицы должно быть book_genres
    """

    def __init__(self):
        try:
            self.conn = psycopg2.connect(
                host=os.getenv("DATABASE_HOST"),
                port=os.getenv("DATABASE_PORT"),
                user=os.getenv("DATABASE_USER"),
                password=os.getenv("DATABASE_PASSWORD"),
                database=os.getenv("DATABASE_NAME"),
            )
            self.conn.autocommit = True
        except Exception as e:
            log.exception("DB connection failed: %s", e)
            raise

    def get_all_books(self) -> List[Dict[str, Any]]:
        cur = self.conn.cursor()
        try:
            cur.execute("""
                SELECT b.id, b.title, b.author, b.year, b.description, b.cover, b.pages,
                       COALESCE(array_agg(g.genre) FILTER (WHERE g.genre IS NOT NULL), '{}') AS genres
                FROM books b
                LEFT JOIN book_genres g ON g.book_id = b.id
                GROUP BY b.id, b.title, b.author, b.year, b.description, b.cover, b.pages;
            """)
            rows = cur.fetchall()
        finally:
            cur.close()

        books = []
        for r in rows:
            books.append({
                "id": r[0],
                "title": r[1],
                "author": r[2],
                "year": r[3],
                "description": r[4],
                "cover": r[5],
                "pages": r[6],
                "genres": list(dict.fromkeys(r[7])) if r[7] else []
            })
        return books

    def get_genres_for_titles(self, titles_and_authors: Iterable[Dict[str, str]]) -> Dict[str, List[str]]:
        """
        Принимает итерацию {'title':..., 'author':...} и возвращает map key -> [genres],
        где key = 'title|||author' lowercased.
        Реализовано безопасно через временную таблицу VALUES(...) + JOIN.
        """
        pairs = []
        for t in titles_and_authors:
            title = (t.get("title") or "").strip()
            author = (t.get("author") or "").strip()
            if title == "" and author == "":
                continue
            pairs.append((title, author))

        if not pairs:
            return {}

        cur = self.conn.cursor()
        try:
            # формируем безопасно VALUES через mogrify
            values_sql = ",".join(cur.mogrify("(%s,%s)", p).decode("utf-8") for p in pairs)
            query = f"""
                WITH v(title, author) AS (VALUES {values_sql})
                SELECT b.title, b.author, COALESCE(array_agg(g.genre) FILTER (WHERE g.genre IS NOT NULL), '{{}}') AS genres
                FROM v
                JOIN books b ON lower(b.title) = lower(v.title) AND coalesce(b.author,'') = coalesce(v.author,'')
                LEFT JOIN book_genres g ON g.book_id = b.id
                GROUP BY b.title, b.author;
            """
            cur.execute(query)
            rows = cur.fetchall()
        finally:
            cur.close()

        res = {}
        for r in rows:
            key = (r[0] or "").strip().lower() + "|||" + (r[1] or "").strip().lower()
            res[key] = list(dict.fromkeys(r[2])) if r[2] else []
        return res
