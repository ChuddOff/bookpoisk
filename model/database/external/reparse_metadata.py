import json
import os
import re
from typing import Optional, Any, Dict, List

from dotenv import load_dotenv
import requests

load_dotenv()

API_KEY = os.getenv("GOOGLE_KEY")
BASE_URL = os.getenv("GOOGLE_URL")
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
           "AppleWebKit/537.36 (KHTML, like Gecko) "
           "Chrome/120.0.0.0 Safari/537.36"}


def search_books(title: str, author: Optional[str] = None) -> Dict[str, Any]:
    q = [f'intitle:"{title}"']

    if author:
        q.append(f'inauthor:"{author}"')

    params = {"q": " ".join(q), "key": API_KEY}

    response = requests.get(BASE_URL, params=params, headers=HEADERS, timeout=10)
    response.raise_for_status()
    return response.json()


def get_book_metadata(book: Dict[str, Any]) -> Dict[str, Any]:
    info = book["volumeInfo"]
    title = info["title"]
    authors = info["authors"] if "authors" in info else None
    dt = None
    if "publishedDate" in info:
        dt = re.compile(r"(\d{4})").search(info["publishedDate"])
    date = str(dt.group(1)) if dt else "3000"
    description = info["description"] if "description" in info else None
    pages = info["pageCount"] if "pageCount" in info else None
    categories = info["categories"] if "categories" in info else None
    images = [i for i in info["imageLinks"].values()] if "imageLinks" in info else None
    language = info["language"]
    read_link = info["infoLink"]

    return {
        "title": title,
        "authors": authors,
        "date": date,
        "description": description,
        "pages": pages,
        "categories": categories,
        "images": images,
        "language": language,
        "read_link": read_link
    }


def get_better_book(books: List[Dict[str, Any]], title: str) -> Dict[str, Any]:
    best_book = books[0] if books else None
    for book in books:
        if book["date"] and int(book["date"]) < int(best_book["date"]):
            best_book = book

    return best_book


if __name__ == "__main__":
    with open("books.json", "r", encoding="utf-8") as file:
        filled_books = json.load(file)

    for f_book in filled_books:
        books = search_books(f_book["title"], f_book["author"])
        reformated_books = []

        if "items" in books:
            for book in books["items"]:
                reformated_books.append(get_book_metadata(book))

        new_book = get_better_book(reformated_books, f_book["title"])

        if new_book:
            try:
                year = int(new_book["date"])
                f_book["year"] = str(year) if year < 2026 else None
            except (ValueError, TypeError):
                f_book["year"] = None

            if new_book.get("images"):
                f_book.setdefault("photos", [])
                f_book["photos"].extend(new_book["images"])

            f_book["read_link"] = new_book.get("read_link")

        with open("books.json", "w", encoding="utf-8") as file:
            json.dump(filled_books, file, ensure_ascii=False, indent=2)
