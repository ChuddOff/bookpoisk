import numpy as np
from typing import List, Optional, Dict, Any
from collections import Counter
import logging

from model.server.models import Book
from model.server.services.book_repository import BookRepository, DBBookRepository

log = logging.getLogger(__name__)

try:
    from sentence_transformers import SentenceTransformer
    _HAS_ST = True
except Exception:
    _HAS_ST = False

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    _HAS_SK = True
except Exception:
    _HAS_SK = False


class EmbeddingService:
    def __init__(self, repo: BookRepository | None = None):
        self.repo = repo or DBBookRepository()
        self.catalog: List[Dict[str, Any]] = []  # will be loaded lazily
        self.model = None
        self.vectorizer = None
        self._embeddings = None
        # lazy load model only when needed
        if _HAS_ST:
            try:
                # do not force-load heavy model until first use
                self.model = SentenceTransformer("all-MiniLM-L6-v2")
            except Exception as e:
                log.warning("SentenceTransformer not available: %s", e)
                self.model = None

        # build catalog lazily
        self._catalog_loaded = False

    def _load_catalog(self):
        if self._catalog_loaded:
            return
        self.catalog = self.repo.get_all_books()
        self._build_catalog_embeddings()
        self._catalog_loaded = True

    def _text_of(self, item: Dict[str, Any]) -> str:
        return " — ".join([str(item.get("title") or ""), str(item.get("author") or ""), str(item.get("description") or "")])

    def _build_catalog_embeddings(self):
        if not self.catalog:
            self._embeddings = np.zeros((0, 1))
            return

        texts = [self._text_of(b) for b in self.catalog]

        if self.model:
            embs = self.model.encode(texts, convert_to_numpy=True)
            norms = np.linalg.norm(embs, axis=1, keepdims=True) + 1e-12
            self._embeddings = embs / norms
            return

        if _HAS_SK:
            self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=20000)
            mat = self.vectorizer.fit_transform(texts).toarray()
            norms = np.linalg.norm(mat, axis=1, keepdims=True) + 1e-12
            self._embeddings = mat / norms
            return

        # fallback hashing
        arr = []
        for t in texts:
            x = np.frombuffer(t.encode("utf-8")[:512].ljust(512, b"\0"), dtype=np.uint8).astype(float)
            vec = np.mean(x.reshape(-1, 16), axis=1)
            vec = vec / (np.linalg.norm(vec) + 1e-12)
            arr.append(vec)
        self._embeddings = np.vstack(arr)

    def _encode_books(self, books: List[Book]) -> np.ndarray:
        if not books:
            # return empty array with shape (0, dim) — if catalog exists, use its dim
            if self._embeddings is None or self._embeddings.size == 0:
                return np.zeros((0, 1))
            return np.zeros((0, self._embeddings.shape[1]))

        texts = [ (b.title or "") + " " + (b.description or "") for b in books ]
        if self.model:
            embs = self.model.encode(texts, convert_to_numpy=True)
        elif self.vectorizer:
            embs = self.vectorizer.transform(texts).toarray()
        else:
            arr = []
            for t in texts:
                x = np.frombuffer(t.encode("utf-8")[:512].ljust(512, b"\0"), dtype=np.uint8).astype(float)
                vec = np.mean(x.reshape(-1, 16), axis=1)
                arr.append(vec)
            embs = np.vstack(arr)
        norms = np.linalg.norm(embs, axis=1, keepdims=True) + 1e-12
        return embs / norms

    def get_recommendations(
        self,
        user_books: List[Book],
        similar_top: int = 10,
        novel_top: int = 10,
        genre_top: int = 10,
        novel_sim_min: float = 0.55,
        novel_sim_max: float = 0.75,
        exclude_read: bool = True
    ):
        # ensure catalog loaded
        self._load_catalog()

        if not self.catalog:
            return {"similar": [], "novel": [], "genre_similar": []}

        # user_books may be list of dicts; try to normalize
        norm_user_books: List[Book] = []
        for ub in user_books:
            if isinstance(ub, Book):
                norm_user_books.append(ub)
            elif isinstance(ub, dict):
                try:
                    norm_user_books.append(Book(**ub))
                except Exception:
                    continue

        # if no user books provided — fall back to top popular (just top similar)
        if not norm_user_books:
            # return top-N catalog items as similar
            top = [{
                "title": b["title"], "author": b.get("author"), "year": b.get("year"), "description": b.get("description")
            } for b in self.catalog[:similar_top]]
            return {"similar": top, "novel": [], "genre_similar": []}

        user_embs = self._encode_books(norm_user_books)  # shape (n_user, dim)
        cat_embs = self._embeddings  # shape (N, dim)

        # compute sims: for each catalog vector, max over user_embs
        sims = []
        for i, emb in enumerate(cat_embs):
            if user_embs.size == 0:
                sim = 0.0
            else:
                vals = (user_embs @ emb).squeeze()
                sim = float(np.max(vals)) if np.size(vals) > 0 else 0.0
            sims.append((i, sim))

        sims.sort(key=lambda x: -x[1])

        scored = []
        for idx, sim in sims:
            entry = dict(self.catalog[idx])
            entry["similarity"] = sim
            scored.append(entry)

        # exclude read
        read_keys = { (b.title or "").strip().lower() + "|||" + (b.author or "").strip().lower() for b in norm_user_books }
        filtered = [b for b in scored if not (exclude_read and ((b.get("title") or "").strip().lower() + "|||" + (b.get("author") or "").strip().lower() in read_keys))]

        similar_list = filtered[:similar_top]

        similar_keys = { (b.get("title") or "").strip().lower() + "|||" + (b.get("author") or "").strip().lower() for b in similar_list }

        novel_candidates = [
            b for b in filtered
            if (b["similarity"] >= novel_sim_min and b["similarity"] <= novel_sim_max)
               and ((b.get("title") or "").strip().lower() + "|||" + (b.get("author") or "").strip().lower() not in similar_keys)
        ]
        novel_list = novel_candidates[:novel_top]

        # genre logic: get genres for user_books via repo, determine favorite genre
        titles_and_authors = [{"title": ub.title, "author": ub.author} for ub in norm_user_books]
        try:
            genres_map = self.repo.get_genres_for_titles(titles_and_authors)
        except Exception:
            genres_map = {}

        genre_counter = Counter()
        for ub in norm_user_books:
            key = (ub.title or "").strip().lower() + "|||" + (ub.author or "").strip().lower()
            gens = genres_map.get(key, [])
            for g in gens:
                genre_counter[g] += 1

        favorite_genre = genre_counter.most_common(1)[0][0] if genre_counter else None

        genre_similar_list = []
        if favorite_genre:
            used_keys = similar_keys.union(((b.get("title") or "").strip().lower() + "|||" + (b.get("author") or "").strip().lower()) for b in novel_list)
            for b in filtered:
                gens = b.get("genres") or []
                if favorite_genre in gens:
                    k = (b.get("title") or "").strip().lower() + "|||" + (b.get("author") or "").strip().lower()
                    if k in used_keys:
                        continue
                    genre_similar_list.append(b)
                    if len(genre_similar_list) >= genre_top:
                        break

        def clean(d):
            return {"title": d.get("title"), "author": d.get("author"), "year": d.get("year"), "description": d.get("description")}

        return {
            "similar": [clean(b) for b in similar_list],
            "novel": [clean(b) for b in novel_list],
            "genre_similar": [clean(b) for b in genre_similar_list]
        }
