import gc
import json
import os.path
import re
import uuid
from typing import Generator, Dict, Optional

import ijson
import psycopg2
from dotenv import load_dotenv
from openai import OpenAI
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


def generate_book_data(book_: Dict) -> Optional[Dict]:
    prompt = format_prompt(book_)
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "user", "content": prompt}
        ]
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

    except:
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


if __name__ == "__main__":
    from_json_to_cache()  # добавляет в кеш уже обработанные книги
    books = [i for i in load_book_from_json()]
    length = len(books)  # определяет количество всех книг

    for idx, book in enumerate(books[load_checkpoint():]):
        try:
            if contains_book(book):
                continue  # если книга есть в кеше, пропускаем

            gen_book = generate_book_data(book)

            if not gen_book:
                continue

            if contains_book(gen_book):
                continue

            if not verify_book_data(book, gen_book):
                continue

            save_book_to_json(gen_book)
            # place_book_in_db(gen_book)

            if idx % 200 == 0:
                gc.collect()

            print(f"[{load_checkpoint()}/{length}] {load_checkpoint() / length * 100:.1f}%")  # процент
        except:
            continue  # если ошибка с заполнением книги, пропускаем
        finally:
            save_checkpoint(load_checkpoint() + 1)


# TODO:
# 1. Save state to file (cache, element index)
# 2. Validation by local LM
# 3. Async while LM generating
# 4. Auto start model and LMStudio
# 5. Remake parser from website
# 6. Maybe some optimization
