import time
from contextlib import contextmanager
from typing import Callable, Any, Optional, Generator

import psycopg2
from psycopg2.pool import SimpleConnectionPool

from config import DB_CONFIG


def retry(func: Callable) -> Callable:
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        from utils import log_error

        for i in range(3):
            try:
                return func(*args, **kwargs)

            except KeyboardInterrupt:
                raise

            except Exception as e:
                log_error(f"Exception while trying to {func.__name__}: {e}")
                time.sleep(1)

        raise KeyboardInterrupt
    return wrapper


@retry
def get_db_connection() -> Optional[psycopg2.extensions.connection]:
    from utils import log_error
    from context import pool

    try:
        conn = pool.getconn()

        # проверка живо ли соединение
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1")

        return conn

    except Exception as e:
        log_error(f"DATABASE CONNECTION LOST: {e}")

        # попытка пересоздать пул соединений
        try:
            pool.closeall()
            pool = SimpleConnectionPool(1, 10, **DB_CONFIG)
            conn = pool.getconn()
            return conn

        # окончательная ошибка
        except Exception as inner_e:
            log_error(f"DATABASE RECONNECT FAILED: {inner_e}")
            return None


@contextmanager
def get_cursor() -> Generator[psycopg2.extensions.cursor, None, None]:
    from utils import log_error
    from context import pool

    conn = get_db_connection()

    if conn is None:
        log_error("CANNOT GET CONNECTION TO DATABASE")
        return None

    try:
        yield conn.cursor()
        conn.commit()

    except Exception as e:
        conn.rollback()
        log_error(f"SAVE TO DATABASE FAILED: {e}")

    finally:
        pool.putconn(conn)
