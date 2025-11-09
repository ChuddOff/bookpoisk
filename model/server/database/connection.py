from contextlib import contextmanager
from typing import Generator

import psycopg2

from model.server.utils import retry



@retry
def get_db_connection() -> psycopg2.extensions.connection:
    from server.core import pool

    connection = pool.getconn()

    with connection.cursor() as cursor:
        cursor.execute('SELECT 1')

    return connection


@contextmanager
def get_cursor() -> Generator[psycopg2.extensions.cursor, None, None]:
    from server.core import pool

    connection = get_db_connection()

    if connection is None:
        return None

    try:
        cursor = connection.cursor()

        if cursor is None:
            raise Exception()

        yield cursor
        connection.commit()

    except Exception as e:
        connection.rollback()

    finally:
        pool.putconn(connection)