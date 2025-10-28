import os
import sys

from dotenv import load_dotenv

load_dotenv()

# конфигурация базы данных
DB_CONFIG = {
    "host": os.getenv("DATABASE_HOST"),
    "port": os.getenv("DATABASE_PORT"),
    "dbname": os.getenv("DATABASE_NAME"),
    "user": os.getenv("DATABASE_USER"),
    "password": os.getenv("DATABASE_PASSWORD")
}

# бэкап файл
BACKUP = "backups/backup.jsonl"

# системный файлы сохранений
CHECKPOINT = "data/checkpoint.txt"
ERR = "data/errors.log"
INDEX_PATH = "data/books.index"
TITLES_PATH = "data/book_titles.tsv"

# настройки эмбеддинг модели
DIM = 384

# настройки локальной модели
MODEL_KEY = os.getenv("MODEL_KEY")
MODEL_NAME = "maziyarpanahi/mistral-7b-instruct-v0.3"
MODEL_URL = os.getenv("MODEL_URL")

if not MODEL_KEY or not MODEL_NAME or not MODEL_URL:
    sys.exit(1)
