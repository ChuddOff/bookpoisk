import gc
import json
import os.path
import re
import sys
import time
import uuid
import subprocess
from concurrent.futures import ThreadPoolExecutor
from typing import Generator, Dict, Optional
from datetime import datetime

import ijson
import psycopg2
import requests
from dotenv import load_dotenv
from openai import OpenAI
from openai.types.chat import ChatCompletionUserMessageParam
from sentence_transformers import SentenceTransformer, util

from language_model.config import MODEL_URL, MODEL_KEY, MODEL_NAME

load_dotenv()

cache = set()  # кеш для хранения названий книг, для избежания повторений
client = OpenAI(base_url=MODEL_URL, api_key=MODEL_KEY)
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')  # эмбеддинг модель для проверки названий книг
DB_CONFIG = {
    "host": os.getenv("DATABASE_URL"),
    "port": os.getenv("DATABASE_PORT"),
    "dbname": os.getenv("DATABASE_NAME"),
    "user": os.getenv("DATABASE_USER"),
    "password": os.getenv("DATABASE_PASSWORD")
}


def load_book_from_json() -> Generator:
    with open("books.json", "r", encoding="utf-8") as file:
        for book_ in ijson.items(file, "item"):
            yield book_


def from_json_to_cache():
    """
    Добавляет в кеш уже обработанные книги
    """

    if not os.path.exists("res_books.jsonl"):
        return

    with open("res_books.jsonl", "r", encoding="utf-8") as file:
        for line in file:
            cache.add(json.loads(line)["title"])


def save_book_to_json(book_: Dict):
    cache.add(book_["title"])

    with open("res_books.jsonl", "a", encoding="utf-8") as file:
        json.dump(book_, file, ensure_ascii=False)
        file.write("\n")


def start_language_model():
    subprocess.run(["powershell", "-Command", "lms server start"])
    time.sleep(1)
    subprocess.run(["powershell", "-Command", f"lms load {MODEL_NAME} --gpu 0.5 --ttl 1800 --context-length 4096"])


def stop_language_model():
    subprocess.run(["powershell", "-Command", f"lms unload {MODEL_NAME}"])
    subprocess.run(["powershell", "-Command", "lms server stop"])
    time.sleep(1)
    subprocess.run(["powershell", "-Command", r'Stop-Process -Name "LM Studio" -Force'])


def ensure_language_model(timeout: int = 15):
    start = time.time()

    while time.time() - start < timeout:
        try:
            resp = requests.get(MODEL_URL, timeout=5)
            if resp.status_code == 200:
                return True

        except Exception as e_:
            log_error(f"START: {e_}")
            time.sleep(1)

    return False


def generate_book_data(book_: Dict) -> Optional[Dict]:
    prompt = format_prompt(book_)

    messages: list[ChatCompletionUserMessageParam] = [
        {"role": "user", "content": prompt}
    ]

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages,
    )
    answer = response.choices[0].message.content
    return format_book(answer, book_)


def verify_book_data(book_: Dict, gen_book_: Dict, threshold: float = 0.85) -> bool:
    """
    Проверяет книгу на верность названия
    :param book_: книга с сайта
    :param gen_book_: сгенерированная книга
    :param threshold: коэффициент совпадения
    """

    emb1 = embedding_model.encode(book_["title"].replace("Книга ", "").split(" (")[0].strip(), convert_to_tensor=True)
    emb2 = embedding_model.encode(gen_book_["title"], convert_to_tensor=True)

    # считаем косинусное сходство
    similarity = util.cos_sim(emb1, emb2).item()

    return similarity >= threshold


def format_book(answer: str, book_: Dict) -> Optional[Dict]:
    """
    Конвертирует ответ модели в необходимый json формат
    :param answer: ответ модели
    :param book_: книга, которая была изначально (до генерации)
    :return: json форматированную книгу
    """

    form_book = dict()

    try:
        answer = json.loads(re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL).strip())

    except Exception as e_:
        log_error(f"FORMAT_BOOK: {e_}")
        return None

    form_book["id"] = str(uuid.uuid4())
    form_book["title"] = answer["title"]
    form_book["author"] = answer["author"]
    form_book["year"] = answer["year"]
    form_book["description"] = answer["description"] if "description" in answer else None
    form_book["genre"] = answer["genre"]
    form_book["cover"] = book_["cover_url"]
    form_book["pages"] = book_["pages"]

    return form_book


def format_prompt(book_: Dict) -> str:
    """
    Создает специальный промпт из данных запаршенной книги
    :param book_: книга изначально (до генерации)
    :return: промпт
    """

    format_book_ = dict()
    format_book_["title"] = book_["title"].replace("Книга ", "").split(" (")[0].strip()
    format_book_["author"] = book_["author"].strip()
    format_book_["year"] = book_["year"]
    format_book_["genre"] = book_["genre"]
    format_book_["description"] = book_["description"]

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


def contains_book(book_: Dict) -> bool:
    title = book_["title"].replace("Книга ", "").split(" (")[0].strip()
    return title in cache


def place_book_in_db(book_: Dict):
    """
    Записывает книгу в бд
    :param book_: сгенеренная и отформатированная книга
    """

    with psycopg2.connect(**DB_CONFIG) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT 1 FROM books WHERE title = %s AND author = %s LIMIT 1",
                (book_["title"], book_["author"])
            )

            if cursor.fetchone():
                return

            cursor.execute("""INSERT INTO books (id, title, author, pages, year, genre, description, cover)
                                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""", (
                book_["id"], book_["title"], book_["author"], book_["pages"],
                book_["year"], book_["genre"], book_["description"], book_["cover"]
            ))

        connection.commit()


def load_checkpoint() -> int:
    if not os.path.exists("checkpoint.txt"):
        return 0

    with open("checkpoint.txt", "r", encoding="utf-8") as file:
        return int(file.read().strip() or 0)


def save_checkpoint(index: int):
    with open("checkpoint.txt", "w", encoding="utf-8") as file:
        file.write(str(index))


def log_error(message: str, log_file: str = "errors.log"):
    """
    Логирует ошибки в файл
    :param message: сообщение ошибки
    :param log_file: файл
    """

    try:
        with open(log_file, "a", encoding="utf-8") as file:
            time_ = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            file.write(f"[{time_}]: {message}\n")

    except Exception as e_:
        print(f"[CRITICAL] Ошибка при записи лога: {e_}")


if __name__ == "__main__":
    start_language_model()  # запускает lm studio и загружает модель

    if not ensure_language_model():
        stop_language_model()
        sys.exit(0)

    from_json_to_cache()  # добавляет в кеш уже обработанные книги

    books = [i for i in load_book_from_json()]
    length = len(books)  # определяет количество всех книг
    checkpoint = load_checkpoint()

    executor = ThreadPoolExecutor(max_workers=2)  # для работы потоков

    try:
        future_gen = None
        validated_future = None
        previous_book = None

        for idx, book in enumerate(books[checkpoint:], start=checkpoint):
            if contains_book(book):
                continue  # если книга есть в кеше, пропускаем

            try:
                # генерация новой книги
                future_gen = executor.submit(generate_book_data, book)

                # валидация предыдущей книги
                if previous_book:
                    try:
                        valid = validated_future.result()
                        if valid:
                            save_book_to_json(previous_book)
                            # place_book_in_db(previous_book)

                    except Exception as e:
                        log_error(f"VALIDATE: {e}")

                # получаем результат генерации
                try:
                    gen_book = future_gen.result()

                except Exception as e:
                    log_error(f"GENERATE: {e}")
                    continue

                if not gen_book:
                    log_error(f"SKIP: {book}")
                    continue

                # валидация новой книги
                validated_future = executor.submit(verify_book_data, book, gen_book)
                previous_book = gen_book

                # сборка мусора
                if idx % 200 == 0:
                    gc.collect()

                # обновление чекпоинта
                checkpoint += 1
                save_checkpoint(checkpoint)

                print(f"[{load_checkpoint()}/{length}] {load_checkpoint() / length * 100:.1f}%")  # процент всех книг

            except KeyboardInterrupt:
                raise

            except Exception as e:
                log_error(f"ERROR: {e}")
                continue

        # обработка последней книги
        if previous_book and validated_future:
            try:
                if validated_future.result():
                    save_book_to_json(previous_book)
                    # place_book_in_db(previous_book)

            except Exception as e:
                log_error(f"VALIDATE: {e}")

    except KeyboardInterrupt:
        save_checkpoint(checkpoint)

    except Exception as e:
        log_error(f"ERROR: {e}")

    finally:
        executor.shutdown(wait=False, cancel_futures=True)
        stop_language_model()
        sys.exit(0)


# TODO:
# 1. Save state to file (cache, element index)
# 2. Validation by local LM
# 3. Async while LM generating
# 4. Logging errors to file
# 5. Auto start model and LMStudio
# 6. Remake parser from website
# 7. Maybe some optimization
