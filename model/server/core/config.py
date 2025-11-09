import os

from dotenv import load_dotenv
from psycopg2.pool import SimpleConnectionPool

from server.services import ClientManager, TaskManager, MemoryClientStore, RedisClientStore

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DATABASE_HOST"),
    "port": os.getenv("DATABASE_PORT"),
    "dbname": os.getenv("DATABASE_NAME"),
    "user": os.getenv("DATABASE_USER"),
    "password": os.getenv("DATABASE_PASSWORD")
}

BACKEND_URL = os.getenv("BACKEND_URL")

store = MemoryClientStore()
client_manager = ClientManager(store)
task_manager = TaskManager()
pool = SimpleConnectionPool(1, 10, **DB_CONFIG)