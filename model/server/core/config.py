import os

from dotenv import load_dotenv
from psycopg2.pool import SimpleConnectionPool

from server.services import ClientManager
from server.services.client_store import MemoryClientStore, RedisClientStore

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DATABASE_HOST"),
    "port": os.getenv("DATABASE_PORT"),
    "dbname": os.getenv("DATABASE_NAME"),
    "user": os.getenv("DATABASE_USER"),
    "password": os.getenv("DATABASE_PASSWORD")
}

store = MemoryClientStore()
manager = ClientManager(store)
pool = SimpleConnectionPool(1, 10, **DB_CONFIG)