import asyncio
import os
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer

from client.database import get_cursor


class EmbeddingManager:
    def __init__(self, cache_file="embeddings/embeddings.pkl"):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.cache_file = cache_file

        self.book_vectors = {}
        self.book_meta = {}

    async def async_encode(self, text, **kwargs):
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, lambda: self.model.encode(text, convert_to_numpy=True, **kwargs)) # type: ignore

    async def initialize_embeddings(self):
        if not os.path.exists(self.cache_file):
            print("Embeddings cache not found — generating fresh embeddings...")
            await self._build_initial_cache()
            return

        print("Loading embeddings from cache...")
        self._load_cache()

        print("Checking for new books in DB...")
        await self._update_cache_fast()

    async def _build_initial_cache(self):
        with get_cursor() as cursor:
            cursor.execute("SELECT id, title, author FROM books")
            rows = cursor.fetchall()

            ids = []
            texts = []

            book_genres_map = {}

            for (bid, title, author) in rows:
                cursor.execute("SELECT genre FROM book_genres WHERE book_id = %s", (bid,))
                genres = [r[0] for r in cursor.fetchall()]
                book_genres_map[bid] = genres

                ids.append(bid)
                texts.append(f"{title} {author} {", ".join(genres)}")

        print(f"Encoding {len(texts)} books…")
        vectors = self.model.encode(texts, batch_size=256, convert_to_numpy=True)

        for (bid, title, author), vec in zip(rows, vectors):
            genres = book_genres_map[bid]
            self.book_vectors[bid] = vec
            self.book_meta[bid] = (title, author, genres)

        self._save_cache()
        print("Initial cache built.")

    def _save_cache(self):
        with open(self.cache_file, "wb") as f:
            pickle.dump({
                "book_vectors": self.book_vectors,
                "book_meta": self.book_meta
            }, f) # type: ignore

    def _load_cache(self):
        with open(self.cache_file, "rb") as f:
            data = pickle.load(f)
            self.book_vectors = data["book_vectors"]
            self.book_meta = data["book_meta"]

    async def _update_cache_fast(self):
        """Обновление кэша: сравнивает только ID."""

        # 1. Читаем только ID книг из БД
        with get_cursor() as cursor:
            cursor.execute("SELECT id FROM books")
            db_ids = {row[0] for row in cursor.fetchall()}

        cache_ids = set(self.book_vectors.keys())

        # 2. Ищем новые книги
        new_ids = db_ids - cache_ids

        if not new_ids:
            print("Cache is up to date.")
            return

        print(f"Found {len(new_ids)} new book(s) → updating cache…")

        # 3. Загружаем только нужные поля новых книг
        placeholders = ",".join(["%s"] * len(new_ids))
        query = f"""
            SELECT id, title, author
            FROM books
            WHERE id IN ({placeholders})
        """

        with get_cursor() as cursor:
            cursor.execute(query, tuple(new_ids))
            rows = cursor.fetchall()

        texts = []
        updated_rows = []

        with get_cursor() as cursor:
            for (bid, title, author) in rows:
                cursor.execute("SELECT genre FROM book_genres WHERE book_id = %s", (bid,))
                genres = [r[0] for r in cursor.fetchall()]

                updated_rows.append((bid, title, author, genres))
                texts.append(f"{title} {author} {' '.join(genres)}")

        vectors = self.model.encode(texts, batch_size=256, convert_to_numpy=True)

        for (bid, title, author, genres), vec in zip(updated_rows, vectors):
            self.book_vectors[bid] = vec
            self.book_meta[bid] = (title, author, genres)

        self._save_cache()
        print("Cache updated with new books.")

    def top_similar(self, read_list, n=30):
        if not read_list:
            return []

        if not self.book_vectors:
            return []

        read_texts = [f"{b.title} {b.author} {" ".join(b.genre) if b.genre else ""}" for b in read_list]
        read_vectors = self.model.encode(read_texts, convert_to_numpy=True)

        avg_vec = np.mean(read_vectors, axis=0)

        ids = list(self.book_vectors.keys())
        mats = np.stack([self.book_vectors[id] for id in ids])

        sims = mats @ avg_vec / (
            np.linalg.norm(mats, axis=1) * np.linalg.norm(avg_vec) + 1e-8
        )

        top_idx = sims.argsort()[-n:][::-1]

        return [
            {"title": self.book_meta[ids[i]][0], "author": self.book_meta[ids[i]][1]}
            for i in top_idx
        ]


embedding_manager = EmbeddingManager()
