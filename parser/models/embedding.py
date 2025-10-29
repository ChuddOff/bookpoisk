import os
from functools import lru_cache

import faiss
import numpy as np
from faiss import IndexFlatIP

from config import DIM, INDEX_PATH, TITLES_PATH
from models import Book, normalize_title


class EmbeddingIndex:
    def __init__(self) -> None:
        self.index: IndexFlatIP = faiss.IndexFlatIP(DIM)
        self.book_titles = []
        self.load_index()

    def add(self, book: Book, vector: np.ndarray) -> None:
        vector = np.array(vector, dtype=np.float32).reshape(1, -1)
        self.index.add(vector)  # type: ignore
        self.book_titles.append(normalize_title(book))

    def search(self, vector: np.ndarray, k: int = 1) -> float:
        if self.index.ntotal == 0:
            return 0.0

        vector = np.array(vector, dtype=np.float32).reshape(1, -1)
        scores, _ = self.index.search(vector, k)  # type: ignore
        return float(scores[0][0])

    def save_index(self) -> None:
        faiss.write_index(self.index, INDEX_PATH)
        with open(TITLES_PATH, "w", encoding="utf-8") as file:
            for book in self.book_titles:
                file.write(book + "\n")

    def load_index(self) -> None:
        from utils import log_error

        if os.path.exists(INDEX_PATH):
            self.index = faiss.read_index(INDEX_PATH)
            if os.path.exists(TITLES_PATH):
                with open(TITLES_PATH, "r", encoding="utf-8") as file:
                    self.book_titles = [line.strip() for line in file]

        if len(self.book_titles) != self.index.ntotal:
            log_error("Index and title file mismatch, reinitializing index")
            self.index = faiss.IndexFlatIP(DIM)
            self.book_titles = []


@lru_cache(maxsize=10_000)
def embedding_book(raw_book: str):
    from context import ctx

    emb = ctx.embedding_model.encode(raw_book, convert_to_tensor=False, normalize_embeddings=True)
    return np.array(emb, dtype=np.float32)


def book_in_cache_embedding(raw_book: Book, threshold: float = 0.85) -> bool:
    from context import embedding

    book_emb = embedding_book(raw_book["title"])
    score = embedding.search(book_emb)

    if score > threshold:
        return True
    return False


def book_in_cache_title(raw_book: Book) -> bool:
    from context import ctx

    title = normalize_title(raw_book)
    return title in ctx.cache


def contains_book(raw_book: Book) -> bool:
    if book_in_cache_title(raw_book):
        return True

    if book_in_cache_embedding(raw_book):
        return True

    return False
