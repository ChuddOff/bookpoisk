import gc
import json
import os.path
import re
import sys
import time
import uuid
import subprocess
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from threading import Lock
from typing import Generator, Dict, Optional, TypedDict, Callable, Any
from datetime import datetime

import faiss
import ijson
import numpy as np
import psycopg2
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from faiss import IndexFlatIP
from openai import OpenAI
from openai.types.chat import ChatCompletionUserMessageParam
from psycopg2.pool import SimpleConnectionPool
from sentence_transformers import SentenceTransformer, util

from language_model.config import MODEL_URL, MODEL_KEY, MODEL_NAME

load_dotenv()

if not MODEL_KEY or not MODEL_NAME or not MODEL_URL:
    sys.exit(1)

DB_CONFIG = {
    "host": os.getenv("DATABASE_HOST"),
    "port": os.getenv("DATABASE_PORT"),
    "dbname": os.getenv("DATABASE_NAME"),
    "user": os.getenv("DATABASE_USER"),
    "password": os.getenv("DATABASE_PASSWORD")
}
CHECKPOINT = "checkpoint.txt"
ERR = "errors.log"
RESULT = "res_books2.jsonl"
BOOKS = "books.json"
INDEX_PATH = "books.index"
DIM = 384

pool = SimpleConnectionPool(1, 10, **DB_CONFIG)
embedding_lock = Lock()


class Context:
    def __init__(self) -> None:
        self.cache: set[str] = set()  # кеш для хранения названий книг, для избежания повторений
        self.client = OpenAI(base_url=MODEL_URL, api_key=MODEL_KEY)
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')  # эмбеддинг модель для проверки названий книг


class Book(TypedDict):
    id: Optional[str]
    title: str
    author: Optional[str]
    year: Optional[int]
    description: Optional[str]
    genre: Optional[list[str]]
    cover: Optional[str]
    pages: Optional[int]


class ChitaiGorodParser:
    BASE_URL = "https://www.chitai-gorod.ru"

    def __init__(self) -> None:
        #
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

    def _fetch(self, url: str) -> str:
        for attempt in range(3):
            try:
                response = self.session.get(url, timeout=10)
                response.raise_for_status()
                return response.text

            except requests.exceptions.RequestException as e:
                log_error(f"ChitaiGorodParser._fetch: {e}")
                time.sleep(2)

        raise RuntimeError(f"ChitaiGorodParser._fetch: {url}")

    @lru_cache(maxsize=500)
    def fetch_page(self, page: int) -> str:
        url = self.BASE_URL + f"/catalog/books/hudozhestvennaya-literatura-110001?page={page}"
        return self._fetch(url)

    def parse_catalog(self, html: str) -> list[str]:
        soup = BeautifulSoup(html, "html.parser")
        links = []

        for tag in soup.find_all("div", class_="product-card__image-wrapper"):
            href = tag.find("a").get("href")

            if href:
                links.append(self.BASE_URL + href)

        return links

    @staticmethod
    def parse_book(html: str) -> Optional[Book]:
        if not html:
            return None

        soup = BeautifulSoup(html, "html.parser")
        main_block = soup.find("main", class_="product-detail-page__main")

        if not main_block:
            return None

        title = author = None
        cover_element = main_block.find("button", class_="product-preview__button")

        if cover_element:
            img = cover_element.find("img")

            if img and img.get("alt"):
                parts = img["alt"].rsplit(" (", 1)
                title = parts[0].strip()
                author = parts[1][:-1] if len(parts) > 1 else None

        cover = None
        preview_div = main_block.find("div", class_="product-preview")
        if preview_div:
            imgs = preview_div.find_all("img")
            if imgs:
                cover = imgs[-1].get("srcset", "").split(", ")[-1].split(" ")[0]

        description = main_block.find("div", class_="product-description-short__text")
        description = description.text.strip() if description else None

        pages = year = genre = None

        for item in main_block.find_all("li", class_="product-properties-item"):
            name = item.find("span", class_="product-properties-item__title").text.strip()
            content = item.find("span", class_="product-properties-item__content").text.strip()

            match name:
                case "Количество страниц":
                    pages = content

                case "Год издания":
                    year = content

                case "Жанры":
                    genre = content

        return Book(id=None, title=title, author=author, year=year, description=description, genre=genre, cover=cover,
                    pages=pages)

    def get_books_from_page(self, page: int) -> list[Book]:
        html = self.fetch_page(page)
        urls = self.parse_catalog(html)
        books = []

        for url in urls:
            book_html = self._fetch(url)
            book = self.parse_book(book_html)
            books.append(book)
            time.sleep(0.2)

        return books

    def parse_count_of_books(self) -> Optional[int]:
        html = self._fetch(self.BASE_URL + f"/catalog/books/hudozhestvennaya-literatura-110001")
        soup = BeautifulSoup(html, "html.parser")
        block = soup.find("div", class_="catalog-products-total")

        if not block:
            return None

        text = block.get_text(strip=True)
        match = re.search(r"(\d[\d\s\xa0]*)", text)

        if match:
            num_str = match.group(1).replace(" ", "").replace("\xa0", "")
            return int(num_str)

        return None


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
        with open("book_titles.txt", "w", encoding="utf-8") as file:
            for book in self.book_titles:
                file.write(book + "\n")

    def load_index(self) -> None:
        if os.path.exists(INDEX_PATH):
            self.index = faiss.read_index(INDEX_PATH)
            if os.path.exists("book_titles.txt"):
                with open("book_titles.txt", "r", encoding="utf-8") as file:
                    self.book_titles = [line.strip() for line in file]


ctx = Context()
parser = ChitaiGorodParser()
embedding = EmbeddingIndex()


def retry(func: Callable) -> Callable:
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        for i in range(3):
            try:
                return func(*args, **kwargs)

            except KeyboardInterrupt:
                raise

            except Exception as e:
                log_error(f"Exception while trying to {func.__name__}: {e}")
                time.sleep(1)

        raise KeyboardInterrupt
    return wrapper


def get_db_connection() -> Optional[psycopg2.connect]:
    try:
        return pool.getconn()
    except psycopg2.Error as e:
        log_error(f"DATABASE: {e.pgerror if hasattr(e, 'pgerror') else e}")
        raise KeyboardInterrupt


def load_book_from_json() -> Generator[Book, None, None]:
    with open(BOOKS, "r", encoding="utf-8") as file:
        for book_data in ijson.items(file, "item"):
            yield book_data


def load_json_cache() -> None:
    """
    Добавляет в кеш уже обработанные книги
    """

    if not os.path.exists("res_books2.jsonl"):
        return

    with open("res_books2.jsonl", "r", encoding="utf-8") as file:
        for line in file:
            book_data = json.loads(line)
            add_book_to_cache(book_data)


def save_book_to_json(raw_book: Book) -> None:
    if raw_book["title"] in ctx.cache:
        return

    with open(RESULT, "a", encoding="utf-8") as file:
        json.dump(raw_book, file, ensure_ascii=False)
        file.write("\n")

    add_book_to_cache(raw_book)


def add_book_to_cache(raw_book: Book) -> None:
    if raw_book["title"] in ctx.cache:
        return

    ctx.cache.add(raw_book["title"])
    emb = embedding_book(raw_book["title"])
    with embedding_lock:
        embedding.add(raw_book, emb)


@retry
def start_language_model() -> None:
    try:
        subprocess.run(["powershell", "-Command", "lms server start"], check=True, timeout=15)
        time.sleep(5)
        subprocess.run(["powershell", "-Command", f"lms load {MODEL_NAME} --gpu 0.5 --ttl 1800 --context-length 4096"], check=True, timeout=60)
    except Exception as exc:
        log_error(f"START MODEL: {exc}")
        sys.exit(1)


def stop_language_model() -> None:
    try:
        subprocess.run(["powershell", "-Command", f"lms unload {MODEL_NAME}"], check=True, timeout=15)
        subprocess.run(["powershell", "-Command", "lms server stop"], check=True, timeout=15)
        time.sleep(1)
        subprocess.run(["powershell", "-Command", r'Stop-Process -Name "LM Studio" -Force'], check=True, timeout=15)
    except Exception as exc:
        log_error(f"STOP MODEL: {exc}")
        sys.exit(1)


def ensure_language_model(timeout: int = 15) -> bool:
    err = None
    start = time.time()

    while time.time() - start < timeout:
        try:
            resp = requests.get(MODEL_URL, timeout=5)
            if resp.status_code == 200:
                return True

        except Exception as exc:
            err = exc
            time.sleep(1)

    log_error(f"START: {err}")
    return False


@retry
def generate_book_data(raw_book: Book) -> Optional[Dict]:
    prompt = format_prompt(raw_book)

    messages: list[ChatCompletionUserMessageParam] = [
        {"role": "user", "content": prompt}
    ]

    try:
        response = ctx.client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
        )
        answer = response.choices[0].message.content
        return format_book(answer, raw_book)

    except Exception as exc:
        log_error(f"GENERATION: {exc}")
        return None


def verify_book_data(raw_book: Book, generated_book: Book, threshold: float = 0.85) -> bool:
    """
    Проверяет книгу на верность названия
    :param raw_book: книга с сайта
    :param generated_book: сгенерированная книга
    :param threshold: коэффициент совпадения
    """

    emb1 = embedding_book(normalize_title(raw_book))
    emb2 = embedding_book(normalize_title(generated_book))

    # считаем косинусное сходство
    similarity = util.cos_sim(emb1, emb2).item()

    return similarity >= threshold


@lru_cache(maxsize=10_000)
def embedding_book(raw_book: str):
    emb = ctx.embedding_model.encode(raw_book, convert_to_tensor=False, normalize_embeddings=True)
    return np.array(emb, dtype=np.float32)


def format_book(answer: str, raw_book: Book) -> Optional[Book]:
    """
    Конвертирует ответ модели в необходимый json формат
    :param answer: ответ модели
    :param raw_book: книга, которая была изначально (до генерации)
    :return: json форматированную книгу
    """

    try:
        answer = json.loads(re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL).strip())

        r_book = Book(id=None, title="", author=None, year=None, description=None, genre=None, cover=None, pages=None)

        r_book["id"] = str(uuid.uuid4())
        r_book["title"] = answer["title"]
        r_book["author"] = answer["author"]
        r_book["year"] = int(answer["year"])
        r_book["description"] = answer["description"] if "description" in answer else None
        r_book["genre"] = answer["genre"].split(", ") if isinstance(raw_book["genre"], str) else answer["genre"]
        r_book["cover"] = raw_book["cover"]
        r_book["pages"] = int(raw_book["pages"])

        return r_book

    except Exception as exc:
        log_error(f"FORMAT_BOOK: {exc}")
        return None


def format_prompt(raw_book: Book) -> str:
    """
    Создает специальный промпт из данных запаршенной книги
    :param raw_book: книга изначально (до генерации)
    :return: промпт
    """

    format_book_ = dict()
    format_book_["title"] = normalize_title(raw_book)
    format_book_["author"] = raw_book["author"].strip()
    format_book_["year"] = raw_book["year"]
    format_book_["genre"] = raw_book["genre"]
    format_book_["description"] = raw_book["description"]

    return f"""
        Ты — помощник, который нормализует данные о книгах.
        
        Тебе будет дан объект книги в формате JSON-подобном виде.  
        Твоя задача — очистить и дополнить информацию по следующим правилам:
        
        1. **title** — привести к оригинальному названию книги:
           - убери слова вроде "набор", "коллекция", "мерч", "комплект", "акция", "том 1–3", "в 2 томах", "книга + 
           подарок" и т. п.;
           - если в названии присутствует русское или английское написание — оставь оригинальное (например, "Harry 
           Potter and the Philosopher’s Stone");
           - не добавляй ничего от себя.
        
        2. **description** — оставь только описание самой книги:
           - убери фразы, относящиеся к наборам, подарочным изданиям, акциям;
           - если текста слишком мало или это просто реклама — перепиши коротко, но по сути (1–2 предложения, отражающих 
           суть книги);
           - не добавляй маркетинговых фраз (вроде "великолепное издание", "отличный подарок").
        
        3. **year** — проверь год написания/публикации книги:
           - если он неверный, замени на правильный;
           - если год отсутствует, добавь корректный;
           - используй только одно число (например, `1954`).
        
        4. **genres** — очисти и нормализуй жанры:
           - приведи к общим категориям (например, "Фэнтези", "Детектив", "Научная фантастика", "Роман", "Драма");
           - убери дубли и лишние уточнения (вроде "роман о любви" → "Роман");
           - если жанров нет — добавь 1–3 подходящих.
        
        ⚠️ Очень важно: верни только обновлённый JSON без пояснений, комментариев и текста вокруг.
        
        Пример входных данных:
        {{
          "title": "Набор книг Гарри Поттер (в 7 томах)",
          "author": "Дж. К. Роулинг",
          "year": "2021",
          "genre": null,
          "description": "Подарочный набор всех книг про Гарри Поттера с цветными иллюстрациями. Отличный подарок 
          любителям магии!"
        }}
        
        Пример ожидаемого ответа:
        {{
          "title": "Harry Potter and the Philosopher’s Stone",
          "author": "Дж. К. Роулинг",
          "year": "1997",
          "genre": "Фэнтези, Приключения",
          "description": "Первая книга о Гарри Поттере — мальчике, который узнаёт, что он волшебник, и отправляется в 
          школу магии Хогвартс."
        }}
        
        Теперь обработай следующую книгу:
        {json.dumps(format_book_, ensure_ascii=False, indent=2)}
        """


def normalize_title(raw_book: Book) -> str:
    if not raw_book["title"]:
        return ""
    t = raw_book["title"].replace("Книга ", "")
    t = re.split(r"\s*\(|[:\-–—]\s*", t)[0]
    return t.strip()


def book_in_cache_embedding(raw_book: Book, threshold: float = 0.85) -> bool:
    book_emb = embedding_book(raw_book["title"])
    score = embedding.search(book_emb)

    if score > threshold:
        return True
    return False


def book_in_cache_title(raw_book: Book) -> bool:
    title = normalize_title(raw_book)
    return title in ctx.cache


def contains_book(raw_book: Book) -> bool:
    if book_in_cache_title(raw_book):
        return True

    if book_in_cache_embedding(raw_book):
        return True

    return False


def skip(log_message: str, checkpoint_: int) -> None:
    log_error(log_message)
    save_checkpoint(checkpoint_)


def save_book_to_db(raw_book: Book) -> None:
    """
    Записывает книгу в бд
    :param raw_book: сгенеренная и отформатированная книга
    """

    connection = get_db_connection()
    connection.autocommit = False

    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT 1 FROM books WHERE title = %s AND author = %s LIMIT 1",
            (raw_book["title"], raw_book["author"])
        )

        if cursor.fetchone():
            return

        try:
            cursor.execute("""
                INSERT INTO books (id, title, author, pages, year, description, cover)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (
                raw_book["id"], raw_book["title"], raw_book["author"],
                int(raw_book["pages"]) if raw_book["pages"] else None, raw_book["year"], raw_book["description"],
                raw_book["cover"]
            ))

            for genre in raw_book["genre"]:
                cursor.execute("""
                    INSERT INTO book_genres (book_id, genre)
                    VALUES (%s, %s)
                    ON CONFLICT DO NOTHING
                """, (raw_book["id"], genre))

            connection.commit()

        except Exception as e:
            connection.rollback()
            log_error(f"DATABASE: {e}")


def load_checkpoint() -> int:
    if not os.path.exists(CHECKPOINT):
        return 0

    with open(CHECKPOINT, "r", encoding="utf-8") as file:
        return int(file.read().strip() or 0)


def save_checkpoint(index: int) -> None:
    with open(CHECKPOINT, "w", encoding="utf-8") as file:
        file.write(str(index))


def log_error(message: str, log_file: str = ERR) -> None:
    """
    Логирует ошибки в файл
    :param message: сообщение ошибки
    :param log_file: файл
    """

    try:
        with open(log_file, "a", encoding="utf-8") as file:
            time_ = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            file.write(f"[{time_}]: {message}\n")

        print(f"[{time_}]: {message}")

    except Exception as exc:
        print(f"[CRITICAL] Ошибка при записи лога: {exc}")


def process_book(checkpoint: int, count_of_books: int) -> None:
    current_page = -1  # нужен как флаг для парсинга каждой новой страницы
    books = []
    executor = ThreadPoolExecutor(max_workers=2)

    try:
        validated_future = None
        previous_book = None

        for idx in range(checkpoint, count_of_books):
            if executor._shutdown:
                executor = ThreadPoolExecutor(max_workers=2)

            try:
                page = idx // 30 + 1

                # при переходе на новую страницу - парсим книги с нее
                if page != current_page:
                    books = parser.get_books_from_page(page)
                    current_page = page

                book = books[idx % max(len(books), 1)]

                if not book:
                    checkpoint += 1
                    skip(f"SKIP: Nothing to show!", checkpoint)
                    continue

                # если книга есть в кэше - пропускаем
                if contains_book(book):
                    checkpoint += 1
                    skip(f"SKIP: {book['title']}", checkpoint)
                    continue

                # асинхронная генерация книги
                future_gen = executor.submit(generate_book_data, book)

                # валидация предыдущей книги
                if previous_book and validated_future:
                    try:
                        valid = validated_future.result()

                        if valid:
                            save_book_to_json(previous_book)
                            save_book_to_db(previous_book)

                    except Exception as e:
                        log_error(f"VALIDATE: {str(e)}")

                # получаем сгенерированные данные
                try:
                    gen_book = future_gen.result()

                except Exception as e:
                    checkpoint += 1
                    skip(f"GENERATE: {str(e)}", checkpoint)
                    continue

                if not gen_book:
                    checkpoint += 1
                    skip(f"GENERATE: {book['title']}", checkpoint)
                    continue

                # если книга есть в кэше - пропускаем
                if contains_book(gen_book):
                    checkpoint += 1
                    skip(f"SKIP: {gen_book['title']}", checkpoint)
                    continue

                # валидация новой книги
                validated_future = executor.submit(verify_book_data, book, gen_book)
                previous_book = gen_book

                # периодическая сборка мусора
                if idx % 200 == 0:
                    gc.collect()

                # обновляем чекпоинт
                checkpoint += 1
                save_checkpoint(checkpoint)
                print(f"[{checkpoint}/{count_of_books}] {checkpoint / count_of_books * 100:.1f}%")

            except KeyboardInterrupt:
                raise

            except Exception as e:
                checkpoint += 1
                skip(f"ERROR: {str(e)}", checkpoint)
                continue

        # обработка последней книги
        if previous_book and validated_future:
            try:
                if validated_future.result():
                    save_book_to_json(previous_book)
                    save_book_to_db(previous_book)

            except Exception as e:
                log_error(f"VALIDATE: {str(e)}")

    except KeyboardInterrupt:
        print(f"Stopping script...")
        save_checkpoint(checkpoint)

    except Exception as e:
        log_error(f"FATAL ERROR: {str(e)}")

    finally:
        embedding.save_index()
        executor.shutdown(wait=True)
        stop_language_model()
        sys.exit(0)


def main() -> None:
    # парсит общее количество книг
    count_of_books = parser.parse_count_of_books()

    # если парсер вернул 0 книг - завершаем работу скрипта
    if not count_of_books:
        sys.exit(0)

    # запускает сервер и локальную модель
    start_language_model()

    # если модель не запустилась - завершение работы
    if not ensure_language_model():
        stop_language_model()
        sys.exit(0)

    checkpoint = load_checkpoint()  # подгружаем чекпоинт из файла
    load_json_cache()  # подгружаем кэш из json

    process_book(checkpoint, count_of_books)


if __name__ == '__main__':
    main()

# TODO:
# 1. Save state to file (cache, element index)
# 2. Validation by local LM
# 3. Async while LM generating
# 4. Logging errors to file
# 5. Auto start model and LMStudio
# 6. Remake parser from website
# 7. Async fixes
# 8. Some optimization
# 9. Refactoring structure
# 10. Make automatically application file
