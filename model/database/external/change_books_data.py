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
import numpy as np
import psycopg2
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from openai import OpenAI
from openai.types.chat import ChatCompletionUserMessageParam
from sentence_transformers import SentenceTransformer, util

from language_model.config import MODEL_URL, MODEL_KEY, MODEL_NAME

load_dotenv()

cache: set[str] = set()  # кеш для хранения названий книг, для избежания повторений
embedding_cache: list = list()
client = OpenAI(base_url=MODEL_URL, api_key=MODEL_KEY)
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')  # эмбеддинг модель для проверки названий книг

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
DB_CONFIG = {
    "host": os.getenv("DATABASE_HOST"),
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

    if not os.path.exists("res_books2.jsonl"):
        return

    with open("res_books2.jsonl", "r", encoding="utf-8") as file:
        for line in file:
            book_ = json.loads(line)
            cache.add(book_["title"])
            embedding_cache.append(embedding_book(book_))


def save_book_to_json(book_: Dict):
    cache.add(book_["title"])
    embedding_cache.append(embedding_book(book_))

    with open("res_books2.jsonl", "a", encoding="utf-8") as file:
        json.dump(book_, file, ensure_ascii=False)
        file.write("\n")


def fetch_html(url: str) -> Optional[str]:
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        return response.text
    except Exception as e_:
        log_error(f"FETCH: {e_}")
        return None


def parse_catalog_html(html: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    items = soup.find_all("div", class_="product-card__image-wrapper")
    return [f"https://www.chitai-gorod.ru{i.find('a').get('href')}" for i in items]


def parse_book_html(html: str) -> Optional[dict]:
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
            title = parts[0]
            author = parts[1][:-1] if len(parts) > 1 else None

    cover = main_block.find("div", class_="product-preview").find_all("img")[-1].get("srcset").split(", ")[-1][:-3]

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

    return {
        "title": title,
        "author": author,
        "year": year,
        "description": description,
        "genre": genre,
        "cover": cover,
        "pages": pages,
    }


def parse_count_of_books(html: str) -> Optional[int]:
    if not html:
        return None

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


def start_language_model():
    try:
        subprocess.run(["powershell", "-Command", "lms server start"])
        time.sleep(5)
        subprocess.run(["powershell", "-Command", f"lms load {MODEL_NAME} --gpu 0.5 --ttl 1800 --context-length 4096"])
    except Exception as e_:
        log_error(f"START MODEL: {e_}")


def stop_language_model():
    try:
        subprocess.run(["powershell", "-Command", f"lms unload {MODEL_NAME}"])
        subprocess.run(["powershell", "-Command", "lms server stop"])
        time.sleep(1)
        subprocess.run(["powershell", "-Command", r'Stop-Process -Name "LM Studio" -Force'])
    except Exception as e_:
        log_error(f"STOP MODEL: {e_}")


def ensure_language_model(timeout: int = 15) -> bool:
    err = None
    start = time.time()

    while time.time() - start < timeout:
        try:
            resp = requests.get(MODEL_URL, timeout=5)
            if resp.status_code == 200:
                return True

        except Exception as e_:
            err = e_
            time.sleep(1)

    log_error(f"START: {err}")
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

    emb1 = embedding_book(book_)
    emb2 = embedding_book(gen_book_)

    # считаем косинусное сходство
    similarity = util.cos_sim(emb1, emb2).item()

    return similarity >= threshold


def embedding_book(book_: Dict):
    emb = embedding_model.encode(normalize_title(book_["title"]), convert_to_tensor=True)
    return emb


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
    form_book["year"] = int(answer["year"])
    form_book["description"] = answer["description"] if "description" in answer else None
    form_book["genre"] = answer["genre"].split(", ")
    form_book["cover"] = book_["cover"]
    form_book["pages"] = int(book_["pages"])

    return form_book


def format_prompt(book_: Dict) -> str:
    """
    Создает специальный промпт из данных запаршенной книги
    :param book_: книга изначально (до генерации)
    :return: промпт
    """

    format_book_ = dict()
    format_book_["title"] = normalize_title(book_["title"])
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


def normalize_title(title: str) -> str:
    if not title:
        return ""
    t = title.replace("Книга ", "")
    t = re.split(r"\s*\(|[:\-–—]\s*", t)[0]
    return t.strip()


def book_in_cache_embedding(book_: dict, threshold: float = 0.85) -> bool:
    book_emb = embedding_book(book_)
    list_emb = np.array(embedding_cache, dtype=np.float32)

    if list_emb.size == 0:
        return False

    similarities = util.cos_sim(book_emb, list_emb)[0]
    best_score = similarities.max().item()

    if best_score > threshold:
        return True
    return False


def book_in_cache_title(book_: dict) -> bool:
    title = normalize_title(book_["title"])
    return title in cache


def contains_book(book_: Dict) -> bool:
    if book_in_cache_title(book_):
        return True

    if book_in_cache_embedding(book_):
        return True

    return False


def skip(log_message: str, checkpoint_: int):
    log_error(log_message)
    save_checkpoint(checkpoint_)


def save_book_to_db(book_: Dict):
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


if __name__ == '__main__':
    l_page = -1  # нужен как флаг для парсинга каждой новой страницы
    books_urls = []

    # парсит общее количество книг
    count_of_books = parse_count_of_books(fetch_html(
        f"https://www.chitai-gorod.ru/catalog/books/hudozhestvennaya-literatura-110001"))

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
    from_json_to_cache()  # подгружаем кэш из json

    executor = ThreadPoolExecutor(max_workers=2)

    try:
        future_gen = None
        validated_future = None
        previous_book = None

        for idx in range(checkpoint, count_of_books):
            try:
                page = idx // 30 + 1

                # при переходе на новую страницу - парсим книги с нее
                if page != l_page:
                    page_html = fetch_html(
                        f"https://www.chitai-gorod.ru/catalog/books/hudozhestvennaya-literatura-110001?page={page}")
                    books_urls = parse_catalog_html(page_html)
                    l_page = page

                book_html = fetch_html(books_urls[idx % 30])
                book = parse_book_html(book_html)

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
                            # save_book_to_db(previous_book)

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
                print(f"[{checkpoint}/{count_of_books}] {checkpoint/count_of_books*100:.1f}%")

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
                    # save_book_to_db(previous_book)

            except Exception as e:
                log_error(f"VALIDATE: {str(e)}")

    except KeyboardInterrupt:
        save_checkpoint(checkpoint)

    except Exception as e:
        log_error(f"FATAL ERROR: {str(e)}")

    finally:
        executor.shutdown(wait=False,cancel_futures=True)
        stop_language_model()
        sys.exit(0)

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
