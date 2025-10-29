import re
import time
from functools import lru_cache
from typing import Optional

import requests
from bs4 import BeautifulSoup

from models import Book
from utils import log_error


class ChitaiGorodParser:
    """
    парсер сайта chitai-gorod.ru с базовыми методами:
    - fetch_page -> загрузка страницы
    - parse_catalog -> получение ссылок на книги
    - parse_book -> парсинг конкретной книги
    """
    BASE_URL = "https://www.chitai-gorod.ru"

    def __init__(self) -> None:
        #
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

    def _fetch(self, url: str) -> str:
        # 3 попытки запроса, если не удалось — кидаем исключение
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
        # извлекает все ссылки на карточки книг со страницы
        soup = BeautifulSoup(html, "html.parser")
        links = []

        for tag in soup.find_all("div", class_="product-card__image-wrapper"):
            href = tag.find("a").get("href")

            if href:
                links.append(self.BASE_URL + href)

        return links

    @staticmethod
    def parse_book(html: str) -> Optional[Book]:
        # парсит конкретную страницу книги
        if not html:
            return None

        soup = BeautifulSoup(html, "html.parser")
        main_block = soup.find("main", class_="product-detail-page__main")

        if not main_block:
            return None

        # заголовок и автор обычно в alt у обложки
        title = author = None
        cover_element = main_block.find("button", class_="product-preview__button")

        if cover_element:
            img = cover_element.find("img")

            if img and img.get("alt"):
                parts = img["alt"].rsplit(" (", 1)
                title = parts[0].strip()
                author = parts[1][:-1] if len(parts) > 1 else None

        # парсинг обложки (srcset берём последний)
        cover = None
        preview_div = main_block.find("div", class_="product-preview")
        if preview_div:
            imgs = preview_div.find_all("img")
            if imgs:
                cover = imgs[-1].get("srcset", "").split(", ")[-1].split(" ")[0]

        # краткое описание, если есть
        description = main_block.find("div", class_="product-description-short__text")
        description = description.text.strip() if description else None

        # технические данные (страницы, год, жанры)
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
        # собирает книги с одной страницы каталога
        html = self.fetch_page(page)
        urls = self.parse_catalog(html)
        books = []

        for url in urls:
            book_html = self._fetch(url)
            book = self.parse_book(book_html)
            books.append(book)
            time.sleep(0.2)  # задержка чтобы не получить бан

        return books

    def parse_count_of_books(self) -> Optional[int]:
        # парсит общее число книг из заголовка каталога
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
