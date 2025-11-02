import json
import os
from typing import Optional, List

from main_package.config import BACKUP
from main_package.models import Book, embedding_book


def load_json_cache() -> None:
    """
    подгружает уже сохранённые книги в кеш и векторный индекс
    нужно, чтобы не генерировать дубли при рестарте
    """
    if not os.path.exists(BACKUP):
        return

    with open(BACKUP, "r", encoding="utf-8") as file:
        for line in file:
            book_data = json.loads(line)
            add_book_to_cache(book_data)


def save_book_to_json(raw_book: Book) -> None:
    """
    добавляет книгу в jsonl-файл, если её ещё нет в кеше.
    """
    from main_package.context import ctx

    if raw_book["title"] in ctx.cache:
        return

    with open(BACKUP, "a", encoding="utf-8") as file:
        json.dump(raw_book, file, ensure_ascii=False)
        file.write("\n")

    add_book_to_cache(raw_book)


def load_backup_json(path: str = BACKUP) -> Optional[List[Book]]:
    if not os.path.exists(path):
        return None

    with open(path, "r", encoding="utf-8") as file:
        books = []
        for line in file:
            books.append(json.loads(line))
        return books


def add_book_to_cache(raw_book: Book) -> None:
    """
    добавляет книгу в кеш и эмбеддинг-индекс (FAISS).
    """
    from main_package.context import ctx, embedding, embedding_lock

    if raw_book["title"] in ctx.cache:
        return

    ctx.cache.add(raw_book["title"])
    emb = embedding_book(raw_book["title"])
    with embedding_lock:
        embedding.add(raw_book, emb)
