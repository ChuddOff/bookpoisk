import os

import httpx
from openai import OpenAI
from dotenv import load_dotenv
from psycopg2.pool import SimpleConnectionPool

load_dotenv()

# CLIENTS SETTINGS #
API_KEY = os.getenv("API_KEY")
SERVER_URL = os.getenv("SERVER_URL")

# MODEL SETTINGS #
transport = httpx.HTTPTransport(retries=0)
model_client = OpenAI(base_url=os.getenv("MODEL_URL"), api_key=os.getenv("MODEL_KEY"),
                      http_client=httpx.Client(transport=transport, trust_env=False))

MODEL_NAME = "maziyarpanahi/mistral-7b-instruct-v0.3"

# DATABASE SETTINGS #
DB_CONFIG = {
    "host": os.getenv("DATABASE_HOST"),
    "port": os.getenv("DATABASE_PORT"),
    "dbname": os.getenv("DATABASE_NAME"),
    "user": os.getenv("DATABASE_USER"),
    "password": os.getenv("DATABASE_PASSWORD")
}

pool = SimpleConnectionPool(1, 10, **DB_CONFIG)
