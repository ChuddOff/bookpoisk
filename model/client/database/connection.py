from contextlib import contextmanager
from typing import Generator

import psycopg2

# from client.utils import retry



# @retry
def get_db_connection() -> psycopg2.extensions.connection:
    from client.core import pool

    connection = pool.getconn()

    if connection is None:
        raise RuntimeError("Unable to connect to database")

    with connection.cursor() as cursor:
        cursor.execute('SELECT 1')

    return connection


@contextmanager
def get_cursor() -> Generator[psycopg2.extensions.cursor, None, None]:
    from client.core import pool

    connection = get_db_connection()

    try:
        cursor = connection.cursor()
        yield cursor
        connection.commit()

    except Exception as e:
        connection.rollback()
        raise

    finally:
        try:
            cursor.close()

        except Exception as e:
            pass

        pool.putconn(connection)