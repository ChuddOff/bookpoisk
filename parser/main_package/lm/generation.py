import json
import re
import uuid
from typing import Optional, Dict

from openai import APIConnectionError, APIError
from openai.types.chat import ChatCompletionUserMessageParam
from sentence_transformers import util

from main_package.config import MODEL_NAME
from main_package.context import ctx
from main_package.database import retry
from main_package.models import Book, normalize_title, format_year, embedding_book
from main_package.utils import log_error


@retry
def generate_book_data(raw_book: Book) -> Optional[Dict]:
    """
    отправляет запрос в LLM с промптом для нормализации книги
    возвращает сгенерированный json или None при ошибке
    """
    prompt = format_prompt(raw_book)

    messages: list[ChatCompletionUserMessageParam] = [
        {"role": "user", "content": prompt}
    ]

    try:
        response = ctx.client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            timeout=240
        )
        answer = response.choices[0].message.content

        if not json.loads(answer):
            log_error(f"GENERATION: answer have incorrect format")
            return None

        return format_answer(answer, raw_book)

    except APIConnectionError as e:
        return {"error": e}

    except APIError as e:
        if "Model unloaded" in str(e):
            return {"error": e}

    except Exception as exc:
        log_error(f"GENERATION: {exc}")
        return None


def verify_book_data(raw_book: Book, generated_book: Book, threshold: float = 0.85) -> bool:
    """
    проверяет, совпадает ли сгенерированное название с исходным
    использует косинусное сходство эмбеддингов
    """
    if not raw_book.get("title") or not generated_book.get("title"):
        return False

    emb1 = embedding_book(normalize_title(raw_book))
    emb2 = embedding_book(normalize_title(generated_book))

    # считаем косинусное сходство
    similarity = util.cos_sim(emb1, emb2).item()

    return similarity >= threshold


def format_answer(answer: str, raw_book: Book) -> Optional[Book]:
    """
    парсит json-ответ модели и дополняет данными из оригинальной книги
    """
    try:
        answer = json.loads(re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL).strip(), strict=True)

        r_book = Book(id=None, title="", author=None, year=None, description=None, genre=None, cover=None, pages=None)

        r_book["id"] = str(uuid.uuid4())
        r_book["title"] = answer["title"] if answer.get("title") else ""
        r_book["author"] = ", ".join(answer["author"]) if isinstance(answer["author"], list) else answer["author"]
        r_book["year"] = format_year(answer["year"])
        r_book["description"] = answer["description"] if "description" in answer else None

        # обработка жанров
        genre = None
        if isinstance(answer["genre"], str):
            genre = answer["genre"].split(", ")
        elif isinstance(answer["genre"], list):
            genre = answer["genre"]

        r_book["genre"] = genre
        r_book["cover"] = raw_book["cover"]
        r_book["pages"] = int(raw_book["pages"]) if raw_book["pages"] else None

        return r_book

    except Exception as exc:
        log_error(f"FORMAT_BOOK: {exc}")
        return None


def format_prompt(raw_book: Book) -> str:
    """
    формирует промпт для LLM
    чётко объясняет задачу модели — очистить и дополнить данные о книге
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
