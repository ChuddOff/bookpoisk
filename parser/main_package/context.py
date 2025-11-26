from threading import Lock

from openai import OpenAI
from psycopg2.pool import SimpleConnectionPool
from sentence_transformers import SentenceTransformer

from main_package.config import MODEL_URL, MODEL_KEY, DB_CONFIG
from main_package.models import EmbeddingIndex
from main_package.pars import ChitaiGorodParser


class Context:
    """
    хранит состояние:
    - кеш названий для проверки дублей
    - клиент OpenAI
    - модель эмбеддингов
    """
    def __init__(self) -> None:
        self.cache: set[str] = set()  # кеш для хранения названий книг, для избежания повторений
        self.client = OpenAI(base_url=MODEL_URL, api_key=MODEL_KEY)
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')  # эмбеддинг модель для проверки названий книг


ctx = Context()
parser = ChitaiGorodParser()
embedding = EmbeddingIndex()

# пул соединений с БД (до 10 активных коннектов)
pool = SimpleConnectionPool(1, 10, **DB_CONFIG)
embedding_lock = Lock()  # нужен, чтобы не было race при добавлении в FAISS
