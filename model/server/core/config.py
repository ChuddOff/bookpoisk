import os

from dotenv import load_dotenv

from model.server.services import ClientManager, TaskManager, MemoryClientStore, RedisClientStore

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL")

store = MemoryClientStore()
client_manager = ClientManager(store)
task_manager = TaskManager()
