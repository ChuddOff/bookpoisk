import os
from dotenv import load_dotenv

from model.server.services import ClientManager, TaskManager, MemoryClientStore
from model.server.services.book_repository import DBBookRepository
from model.server.services.embedding_service import EmbeddingService

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL")

store = MemoryClientStore()
client_manager = ClientManager(store)
task_manager = TaskManager()
book_repository = DBBookRepository()
embedding_service = EmbeddingService(book_repository)
