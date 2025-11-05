import gc
import sys
from concurrent.futures import ThreadPoolExecutor

from main_package.context import parser, embedding
from main_package.database import save_book_to_db, save_checkpoint, load_checkpoint
from main_package.lm import generate_book_data, verify_book_data, stop_language_model, start_language_model, ensure_language_model
from main_package.models import contains_book
from main_package.utils import save_book_to_json, load_json_cache, skip, log_error


def process_book(checkpoint: int, count_of_books: int, debug: bool = False, save: bool = True) -> None:
    """
    главный цикл парсинга и генерации
    работает постранично, с кешированием и асинхронной генерацией/валидацией
    """
    current_page = -1
    books = []

    executor = ThreadPoolExecutor(max_workers=2)
    validated_future = None
    previous_book = None

    try:
        for idx in range(checkpoint, count_of_books):
            # пересоздаём executor при ручном shutdown (редкий кейс)
            if executor._shutdown:
                executor = ThreadPoolExecutor(max_workers=2)

            try:
                current_page, books, checkpoint, previous_book, validated_future = _process_page(
                    idx, checkpoint, current_page, books,
                    previous_book, validated_future, executor,
                    count_of_books, debug, save
                )

            except KeyboardInterrupt:
                raise

            except Exception as e:
                checkpoint += 1
                skip(f"ERROR: {str(e)}", checkpoint, debug, save)

        _handle_validation(previous_book, validated_future, debug, save)

    except KeyboardInterrupt:
        print(f"Stopping parser...")
        save_checkpoint(checkpoint) if save else None

    except Exception as e:
        log_error(f"FATAL ERROR: {str(e)}", debug=debug)

    finally:
        _finalize_process(executor, save)


def _process_page(idx, checkpoint, current_page, books, previous_book,
                  validated_future, executor, count_of_books, debug, save):
    """ функция обработки книги """
    page = idx // 30 + 1
    if page != current_page:
        books = parser.get_books_from_page(page)
        current_page = page

    book = books[idx % max(len(books), 1)]

    if not book:
        checkpoint += 1
        skip("SKIP: Nothing to show!", checkpoint, debug, save)
        return current_page, books, checkpoint, previous_book, validated_future

    if contains_book(book):
        checkpoint += 1
        skip(f"SKIP: {book['title']}", checkpoint, debug, save)
        return current_page, books, checkpoint, previous_book, validated_future

    # Генерация и валидация
    future_gen = executor.submit(generate_book_data, book)
    _handle_validation(previous_book, validated_future, debug, save)

    try:
        gen_book = future_gen.result()

    except Exception as e:
        checkpoint += 1
        skip(f"GENERATE: {str(e)}", checkpoint, debug, save)
        return current_page, books, checkpoint, previous_book, validated_future

    if not gen_book or "error" in gen_book:
        checkpoint += 1
        skip(f"GENERATE: {book['title']}", checkpoint, debug, save)
        return current_page, books, checkpoint, previous_book, validated_future

    if contains_book(gen_book):
        checkpoint += 1
        skip(f"SKIP: {gen_book['title']}", checkpoint, debug, save)
        return current_page, books, checkpoint, previous_book, validated_future

    # Асинхронная валидация
    validated_future = executor.submit(verify_book_data, book, gen_book)
    previous_book = gen_book

    # Сборка мусора и чекпоинт
    if idx % 200 == 0:
        embedding.save_index() if save else None
        gc.collect()

    checkpoint += 1
    save_checkpoint(checkpoint) if save else None
    print(f"[{checkpoint}/{count_of_books}] {checkpoint / count_of_books * 100:.1f}%")

    return current_page, books, checkpoint, previous_book, validated_future


def _handle_validation(previous_book, validated_future, debug: bool, save: bool):
    """ проверяет и сохраняет предыдущую книгу """
    if previous_book and validated_future:
        try:
            valid = validated_future.result()

            if valid and save:
                save_book_to_json(previous_book)
                save_book_to_db(previous_book)

        except Exception as e:
            log_error(f"VALIDATE: {str(e)}", debug=debug)


def _finalize_process(executor: ThreadPoolExecutor, save: bool):
    """ корректное завершение работы """
    embedding.save_index() if save else None
    executor.shutdown(wait=True)
    stop_language_model()
    sys.exit(0)


def main(start: int = -1, end: int = -1, debug: bool = False, save: bool = True, power: float = 1.0) -> None:
    """
    точка входа:
    - получает количество книг
    - запускает модель
    - восстанавливает состояние
    - начинает основной цикл
    """
    # парсит общее количество книг
    count_of_books = parser.parse_count_of_books() if end < 0 else end

    # если парсер вернул 0 книг - завершаем работу скрипта
    if not count_of_books:
        sys.exit(0)

    # запускает сервер и локальную модель
    start_language_model(power)

    # если модель не запустилась - завершение работы
    if not ensure_language_model():
        stop_language_model()
        sys.exit(0)

    checkpoint = load_checkpoint() if start < 0 else start  # подгружаем чекпоинт из файла
    load_json_cache()  # подгружаем кэш из json

    process_book(checkpoint, count_of_books, debug, save)
