from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager


def setup_driver() -> webdriver.Chrome:
    """Создает и настраивает драйвер Chrome."""
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    return webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)


def get_book_links(driver: webdriver.Chrome, page_number: int) -> list[str]:
    """Возвращает список ссылок на книги с указанной страницы каталога."""
    url = f"https://www.chitai-gorod.ru/catalog/books/hudozhestvennaya-literatura-110001?page={page_number}"
    driver.get(url)
    card_elements = driver.find_elements(By.CLASS_NAME, "product-card__image-wrapper")
    return [card.find_element(By.TAG_NAME, "a").get_attribute("href") for card in card_elements]


def parse_book_page(driver: webdriver.Chrome, book_url: str) -> dict:
    """Парсит страницу книги и возвращает данные в виде словаря."""
    driver.get(book_url)
    main_block = driver.find_element(By.CLASS_NAME, "product-detail-page__main")

    # Заголовок и автор
    cover_element = main_block.find_element(By.CLASS_NAME, "product-preview__button")
    title_text = cover_element.find_element(By.TAG_NAME, "img").get_attribute("alt").split(" (")
    title = title_text[0]
    author = title_text[1][:-1]

    # Фото
    photo_elements = main_block.find_element(By.CLASS_NAME, "product-media__preload").find_elements(By.TAG_NAME, "img")
    photo_urls = [p.get_attribute("srcset").split(", ")[-1][:-3] for p in photo_elements]
    cover_url = photo_urls.pop(0) if photo_urls else None

    # Теги
    try:
        tag_elements = main_block.find_element(
            By.CSS_SELECTOR, "ul.product-tag-list.product-detail-page__tags"
        ).find_elements(By.TAG_NAME, "a")
        tags = [tag.text for tag in tag_elements]
    except Exception:
        tags = []

    # Описание
    description = main_block.find_element(By.CSS_SELECTOR, "div.product-description-short__text").text

    # Характеристики
    pages, year, genre = None, None, None
    for item in main_block.find_elements(By.CSS_SELECTOR, "li.product-properties-item"):
        content = item.find_element(By.CLASS_NAME, "product-properties-item__content").text
        name = item.find_element(By.CLASS_NAME, "product-properties-item__title").text

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


def main():
    driver = setup_driver()

    for page_number in range(3332):
        book_links = get_book_links(driver, page_number)

        for book_url in book_links:
            book_data = parse_book_page(driver, book_url)

            print(
                f"title: {book_data['title']};\n"
                f"author: {book_data['author']};\n"
                f"year: {book_data['year']};\n"
                f"description: {book_data['description']};\n"
                f"genre: {book_data['genre']};\n"
                f"tags: {book_data['tags']};\n"
                f"cover: {book_data['cover_url']};\n"
                f"photos: {book_data['photos']};\n"
                f"pages: {book_data['pages']};\n"
            )

        print(f"{page_number / 1631 * 100:.2f} %")

    driver.quit()


if __name__ == "__main__":
    main()
