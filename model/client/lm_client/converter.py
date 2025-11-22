from openai.types.chat import ChatCompletion

from client.models import GenerationResultRequest, Book


def convert_answer(response: ChatCompletion, task_id: str) -> GenerationResultRequest:
    from . import try_fix_json

    raw = response.choices[0].message.content
    data = try_fix_json(raw)
    books = []

    if not data:
        raise ValueError("Model returned invalid response")

    for b in data["books"]:
        if isinstance(b.get("author"), list):
            b["author"] = ", ".join(b["author"])
        books.append(Book(**b))

    return GenerationResultRequest(task_id=task_id, result=books)
