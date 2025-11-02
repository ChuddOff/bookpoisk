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
    current_page = -1  # нужен как флаг для парсинга каждой новой страницы
    books = []
    executor = ThreadPoolExecutor(max_workers=2)

    try:
        validated_future = None
        previous_book = None

        for idx in range(checkpoint, count_of_books):
            # пересоздаём executor при ручном shutdown (редкий кейс)
            if executor._shutdown:
                executor = ThreadPoolExecutor(max_workers=2)

            try:
                page = idx // 30 + 1  # каждая страница содержит 30 книг

                # при переходе на новую страницу - парсим книги с нее
                if page != current_page:
                    books = parser.get_books_from_page(page)
                    current_page = page

                book = books[idx % max(len(books), 1)]

                if not book:
                    checkpoint += 1
                    skip(f"SKIP: Nothing to show!", checkpoint, debug, save)
                    continue

                # если книга есть в кэше - пропускаем
                if contains_book(book):
                    checkpoint += 1
                    skip(f"SKIP: {book['title']}", checkpoint, debug, save)
                    continue

                # асинхронная генерация книги
                future_gen = executor.submit(generate_book_data, book)

                # валидация предыдущей книги
                if previous_book and validated_future:
                    try:
                        valid = validated_future.result()

                        if valid and save:
                            save_book_to_json(previous_book)
                            save_book_to_db(previous_book)

                    except Exception as e:
                        log_error(f"VALIDATE: {str(e)}", debug=debug)

                # получаем сгенерированные данные
                try:
                    gen_book = future_gen.result()

                except Exception as e:
                    checkpoint += 1
                    skip(f"GENERATE: {str(e)}", checkpoint, debug, save)
                    continue

                if "error" in gen_book:
                    continue

                if not gen_book:
                    checkpoint += 1
                    skip(f"GENERATE: {book['title']}", checkpoint, debug, save)
                    continue

                # если книга есть в кэше - пропускаем
                if contains_book(gen_book):
                    checkpoint += 1
                    skip(f"SKIP: {gen_book['title']}", checkpoint, debug, save)
                    continue

                # валидация новой книги
                validated_future = executor.submit(verify_book_data, book, gen_book)
                previous_book = gen_book

                # периодическая сборка мусора
                if idx % 200 == 0:
                    embedding.save_index() if save else None
                    gc.collect()

                # обновляем чекпоинт
                checkpoint += 1
                save_checkpoint(checkpoint) if save else None
                print(f"[{checkpoint}/{count_of_books}] {checkpoint / count_of_books * 100:.1f}%")

            except KeyboardInterrupt:
                raise

            except Exception as e:
                checkpoint += 1
                skip(f"ERROR: {str(e)}", checkpoint, debug, save)
                continue

        # обработка последней книги
        if previous_book and validated_future:
            try:
                if validated_future.result() and save:
                    save_book_to_json(previous_book)
                    save_book_to_db(previous_book)

            except Exception as e:
                log_error(f"VALIDATE: {str(e)}", debug=debug)

    except KeyboardInterrupt:
        print(f"Stopping parser...")

        save_checkpoint(checkpoint) if save else None

    except Exception as e:
        log_error(f"FATAL ERROR: {str(e)}", debug=debug)

    finally:
        # сохраняем состояние и корректно завершаем всё
        embedding.save_index() if save else None
        executor.shutdown(wait=True)
        stop_language_model()
        sys.exit(0)


def main(start: int = -1, end: int = -1, debug: bool = False, save: bool = True) -> None:
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
    start_language_model()

    # если модель не запустилась - завершение работы
    if not ensure_language_model():
        stop_language_model()
        sys.exit(0)

    checkpoint = load_checkpoint() if start < 0 else start  # подгружаем чекпоинт из файла
    load_json_cache()  # подгружаем кэш из json

    process_book(checkpoint, count_of_books, debug, save)
