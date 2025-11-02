import os
import sys
from pathlib import Path

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

DATA_DIR = Path(__file__).resolve().parent.parent / "main_package/data"
DATA_DIR.mkdir(exist_ok=True)

BACKUP_DIR = Path(__file__).resolve().parent.parent / "main_package/backups"
BACKUP_DIR.mkdir(exist_ok=True)

# бэкап файл
BACKUP = BACKUP_DIR / "backup.jsonl"

# системный файлы сохранений
CHECKPOINT = DATA_DIR / "checkpoint.txt"
ERR = DATA_DIR / "errors.log"
INDEX_PATH = DATA_DIR / "books.index"
TITLES_PATH = DATA_DIR / "book_titles.tsv"

# настройки эмбеддинг модели
DIM = 384

# настройки локальной модели
MODEL_KEY = os.getenv("MODEL_KEY")
MODEL_NAME = "maziyarpanahi/mistral-7b-instruct-v0.3"
MODEL_URL = os.getenv("MODEL_URL")

# если модель не настроена — сразу выходим, нет смысла работать дальше
if not MODEL_KEY or not MODEL_NAME or not MODEL_URL:
    sys.exit(1)
