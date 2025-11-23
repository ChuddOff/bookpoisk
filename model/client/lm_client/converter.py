from openai.types.chat import ChatCompletion

from client.database import fill_book_from_db


def convert_answer(response: ChatCompletion, unsuitable_books: list) -> list:
    from . import try_fix_json, validate_book_entry

    raw = response.choices[0].message.content
    data = try_fix_json(raw)
    books = []

    if not data:
        raise ValueError("Model returned invalid response")

    for b in data["books"]:
        if isinstance(b.get("author"), list):
            b["author"] = ", ".join(b["author"])

        if isinstance(b.get("author"), str):
            b["author"] = b["author"].strip()

        if isinstance(b.get("title"), str):
            b["title"] = b["title"].strip()

        if not validate_book_entry(b):
            continue

        book = fill_book_from_db(**b)

        if not book:
            unsuitable_books.append(b)
            continue

        books.append(book)

    return books
