import re
from typing import Optional, TypedDict


class Book(TypedDict):
    """
    универсальный формат книги — используется и для сырых, и для сгенерированных данных
    """
    id: Optional[str]
    title: str
    author: Optional[str]
    year: Optional[int]
    description: Optional[str]
    genre: Optional[list[str]]
    cover: Optional[str]
    pages: Optional[int]


def format_year(year: str | int) -> Optional[int]:
    """
    преобразует разные форматы годов (строки, диапазоны, BC и т.п.) в int
    """
    if not year:
        return None

    if isinstance(year, int):
        return year

    text = year.strip().replace("–", "-").lower()
    is_bc = any(x in text for x in ["bc", "до н"])  # проверка на "год до нашей эры"
    digits = [int(y) for y in re.findall(r"\d{1,4}", text)]  # получение всех чисел

    if not digits:
        return None

    year = digits[-1]  # если диапазон - берем последнее значение
    return -year if is_bc else year


def normalize_title(raw_book: Book) -> str:
    """
    упрощает название книги: убирает лишние слова и скобки
    """
    if not raw_book["title"]:
        return ""
    t = raw_book["title"].replace("Книга ", "")
    t = re.split(r"\s*\(|[:\-–—]\s*", t)[0]
    return t.strip()

