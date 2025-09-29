import json
import os
import uuid

import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DATABASE_URL"),
    "port": os.getenv("DATABASE_PORT"),
    "dbname": os.getenv("DATABASE_NAME"),
    "user": os.getenv("DATABASE_USER"),
    "password": os.getenv("DATABASE_PASSWORD")
}

BOOKS_JSON_FILE = "books.json"


def get_connection():
    return psycopg2.connect(**DB_CONFIG)


def load_books_from_json(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    books = []
    for item in data:
        books.append({
            "id": str(uuid.uuid4()),
            "title": str(item.get("title")).replace("Книга ", "").split(" (")[0],
            "author": item.get("author"),
            "pages": item.get("pages"),
            "year": item.get("year"),
            "genre": item.get("genre"),
            "description": item.get("description"),
            "cover": item.get("cover_url")
        })
    return books


def insert_books(books):
    conn = get_connection()
    with conn:
        with conn.cursor() as cur:
            for book in books[:50]:
                try:
                    cur.execute(
                        "SELECT 1 FROM books WHERE title = %s AND author = %s LIMIT 1",
                        (book["title"], book["author"])
                    )
                    if cur.fetchone():
                        continue

                    cur.execute("""
                        INSERT INTO books (id, title, author, pages, year, genre, description, cover)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        book["id"], book["title"], book["author"], book["pages"],
                        book["year"], book["genre"], book["description"], book["cover"]
                    ))

                    conn.commit()

                except psycopg2.errors.StringDataRightTruncation:
                    print(book)
                    break
    conn.close()


if __name__ == "__main__":
    books = load_books_from_json(BOOKS_JSON_FILE)
    insert_books(books)
