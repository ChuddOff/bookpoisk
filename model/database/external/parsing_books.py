import asyncio
import json
import os
import time
from datetime import timedelta

import aiohttp
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
BASE_URL = "https://www.chitai-gorod.ru"
TOTAL_PAGES = 3332
START_PAGE = 598
OUTPUT_FILE = "books.json"


def format_time(seconds: float) -> str:
    return str(timedelta(seconds=int(seconds)))


def load_existing_books(filename: str = OUTPUT_FILE) -> set:
    if not os.path.exists(filename):
        return set()

    with open(filename, "r", encoding="utf-8") as f:
        try:
            books = json.load(f)
        except json.JSONDecodeError:
            return set()

    return {f"{b['title']}|{b['author']}" for b in books if b.get("title") and b.get("author")}


def save_books_to_json(books: list, filename: str = OUTPUT_FILE):
    existing_books = []
    if os.path.exists(filename):
        with open(filename, "r", encoding="utf-8") as f:
            try:
                existing_books = json.load(f)
            except json.JSONDecodeError:
                existing_books = []

    all_books = existing_books + books

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(all_books, f, ensure_ascii=False, indent=4)


def parse_book_html(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    main_block = soup.find("main", class_="product-detail-page__main")

    title = author = None
    cover_element = main_block.find("button", class_="product-preview__button")
    if cover_element:
        img = cover_element.find("img")
        if img and img.get("alt"):
            parts = img["alt"].rsplit(" (", 1)
            title = parts[0]
            author = parts[1][:-1] if len(parts) > 1 else None

    photo_elements = main_block.find("div", class_="product-preview").find_all("img")
    photo_urls = [p.get("srcset").split(", ")[-1][:-3] for p in photo_elements]
    cover_url = photo_urls.pop(0) if photo_urls else None

    tags = []
    tag_block = main_block.find("ul", class_="product-tag-list product-detail-page__tags")
    if tag_block:
        tags = [tag.text for tag in tag_block.find_all("a")]

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
        "tags": tags,
        "cover_url": cover_url,
        "photos": photo_urls,
        "pages": pages,
    }


def parse_catalog_html(html: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    items = soup.find_all("div", class_="product-card__image-wrapper")
    return [f"{BASE_URL}{i.find('a').get('href')}" for i in items]


async def fetch(session: aiohttp.ClientSession, url: str, sem: asyncio.Semaphore) -> str:
    async with sem:  # ограничиваем количество запросов
        async with session.get(url, headers=HEADERS) as resp:
            return await resp.text()


async def parse_book(session: aiohttp.ClientSession, url: str, sem: asyncio.Semaphore) -> dict:
    html = await fetch(session, url, sem)
    return parse_book_html(html)


async def get_books_links(session: aiohttp.ClientSession, page: int, sem: asyncio.Semaphore) -> list[str]:
    url = f"{BASE_URL}/catalog/books/hudozhestvennaya-literatura-110001?page={page}"
    html = await fetch(session, url, sem)
    return parse_catalog_html(html)


async def main():
    sem = asyncio.Semaphore(4)

    existing_keys = set()
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            try:
                existing_books = json.load(f)
                existing_keys = {f"{b['title']}|{b['author']}" for b in existing_books if
                                 b.get("title") and b.get("author")}
            except json.JSONDecodeError:
                existing_books = []

    async with aiohttp.ClientSession() as session:
        for page in range(START_PAGE, TOTAL_PAGES + 1):
            try:
                start = asyncio.get_event_loop().time()

                book_links = await get_books_links(session, page, sem)

                tasks = [parse_book(session, link, sem) for link in book_links]
                books = await asyncio.gather(*tasks)

                new_books = []
                for book in books:
                    key = f"{book['title']}|{book['author']}"
                    if key not in existing_keys:
                        new_books.append(book)
                        existing_keys.add(key)

                if new_books:
                    save_books_to_json(new_books)

                end = asyncio.get_event_loop().time()
                elapsed = end - start
                eta = elapsed * (TOTAL_PAGES - page)

                print(f"[{page}/{TOTAL_PAGES}] {page / TOTAL_PAGES * 100:.1f}% "
                      f"elapsed: {format_time(elapsed)}, eta: {format_time(eta)}")
            except Exception:
                time.sleep(300)
                page -= 1
                continue

        print("✅ Парсинг завершён")


if __name__ == "__main__":
    asyncio.run(main())
