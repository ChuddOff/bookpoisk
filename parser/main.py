import gc
import sys
from concurrent.futures import ThreadPoolExecutor

from context import parser, embedding
from database import save_book_to_db, save_checkpoint, load_checkpoint
from lm import generate_book_data, verify_book_data, stop_language_model, start_language_model, ensure_language_model
from models import contains_book
from utils import save_book_to_json, load_json_cache, skip, log_error


def process_book(checkpoint: int, count_of_books: int) -> None:
    current_page = -1  # нужен как флаг для парсинга каждой новой страницы
    books = []
    executor = ThreadPoolExecutor(max_workers=2)

    try:
        validated_future = None
        previous_book = None

        for idx in range(checkpoint, count_of_books):
            if executor._shutdown:
                executor = ThreadPoolExecutor(max_workers=2)

            try:
                page = idx // 30 + 1

                # при переходе на новую страницу - парсим книги с нее
                if page != current_page:
                    books = parser.get_books_from_page(page)
                    current_page = page

                book = books[idx % max(len(books), 1)]

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
                            save_book_to_db(previous_book)

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
                    embedding.save_index()
                    gc.collect()

                # обновляем чекпоинт
                checkpoint += 1
                save_checkpoint(checkpoint)
                print(f"[{checkpoint}/{count_of_books}] {checkpoint / count_of_books * 100:.1f}%")

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
                    save_book_to_db(previous_book)

            except Exception as e:
                log_error(f"VALIDATE: {str(e)}")

    except KeyboardInterrupt:
        print(f"Stopping script...")
        save_checkpoint(checkpoint)

    except Exception as e:
        log_error(f"FATAL ERROR: {str(e)}")

    finally:
        embedding.save_index()
        executor.shutdown(wait=True)
        stop_language_model()
        sys.exit(0)


def main() -> None:
    # парсит общее количество книг
    count_of_books = parser.parse_count_of_books()

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
    load_json_cache()  # подгружаем кэш из json

    process_book(checkpoint, count_of_books)


if __name__ == '__main__':
    main()


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
