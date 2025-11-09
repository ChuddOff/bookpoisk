from datetime import datetime
import re

from openai.types.chat import ChatCompletion

from client.database import book_exists_in_db
from client.models import GenerationResultRequest, Book


def convert_answer(response: ChatCompletion, task_id: str) -> GenerationResultRequest:
    answer = re.sub(r"<think>.*?</think>", "", response.choices[0].message.content, flags=re.DOTALL).strip()

    books = [i.split(" - ") for i in answer[answer.find("books"):].split("\n")]
    result = []

    for book in books:
        title = book[0]
        author = book[-1]

        if not book_exists_in_db(title, author):
            ...

        result.append(Book(title=title, author=author))

    return GenerationResultRequest(task_id=task_id, result=result, generated_at=datetime.now().isoformat())

