import json
import os

from config import BACKUP
from models import Book, embedding_book


def load_json_cache() -> None:
    """
    подгружает уже сохранённые книги в кеш и векторный индекс
    нужно, чтобы не генерировать дубли при рестарте
    """
    if not os.path.exists("res_books2.jsonl"):
        return

    with open("res_books2.jsonl", "r", encoding="utf-8") as file:
        for line in file:
            book_data = json.loads(line)
            add_book_to_cache(book_data)


def save_book_to_json(raw_book: Book) -> None:
    """
    добавляет книгу в jsonl-файл, если её ещё нет в кеше.
    """
    from context import ctx

    if raw_book["title"] in ctx.cache:
        return

    with open(BACKUP, "a", encoding="utf-8") as file:
        json.dump(raw_book, file, ensure_ascii=False)
        file.write("\n")

    add_book_to_cache(raw_book)


def add_book_to_cache(raw_book: Book) -> None:
    """
    добавляет книгу в кеш и эмбеддинг-индекс (FAISS).
    """
    from context import ctx, embedding, embedding_lock

    if raw_book["title"] in ctx.cache:
        return

    ctx.cache.add(raw_book["title"])
    emb = embedding_book(raw_book["title"])
    with embedding_lock:
        embedding.add(raw_book, emb)
