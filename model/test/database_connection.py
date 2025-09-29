import os

import psycopg2
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
  host=os.getenv("DATABASE_URL"),
  port=int(os.getenv("DATABASE_PORT")),
  dbname=os.getenv("DATABASE_NAME"),
  user=os.getenv("DATABASE_USER"),
  password=os.getenv("DATABASE_PASSWORD")
)

cur = conn.cursor()

cur.execute("SELECT version();")
print(cur.fetchone())

cur.execute("""
  SELECT table_name 
  FROM information_schema.tables
  WHERE table_schema = 'public';
  """)
for row in cur.fetchall():
  print(row)

cur.execute("""
  SELECT column_name, data_type 
  FROM information_schema.columns
  WHERE table_name = 'books';
  """)
for row in cur.fetchall():
  print(row)

# cur.execute("""DELETE FROM books;""")
# conn.commit()

cur.execute("""SELECT id, title, author, year, cover FROM books""")
for row in cur.fetchall():
  print(f"Id: {row[0]}, title: {row[1]}, author: {row[2]}, year: {row[3]}, cover: {row[4]}")

cur.close()
conn.close()
