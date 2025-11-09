from pathlib import Path

from client.core import model_client, MODEL_NAME
from client.lm_client import validate_answer, convert_answer
from client.models import GenerationRequest, Task, GenerationResultRequest


def create_prompt(req: GenerationRequest) -> str:
    with open(Path(__file__).resolve().parent / "prompts/basic_prompt.txt", "r", encoding="utf-8") as file:
        basic_prompt = file.read()

    prompt = f"""Теперь обработай список этих книг:
{"\n".join([i.title + " - " + i.author for i in req.books])}
                 """

    print(basic_prompt + "\n" + prompt)

    return basic_prompt + "\n" + prompt


def model_generate(req: Task) -> GenerationResultRequest:
    response = model_client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": create_prompt(req.request)}],
        temperature=0.5,
        max_tokens=4096
    )

    if not validate_answer(response):
        ...
    res = convert_answer(response, req.task_id)
    print(res)
    return res