import asyncio
import subprocess
import time
from pathlib import Path
from typing import Optional

import requests

from client.core import model_client, MODEL_NAME
from client.lm_client import validate_answer, convert_answer
from client.models import GenerationRequest, Task, GenerationResultRequest
from client.server import send_result

model_lock = asyncio.Lock()


def start_language_model() -> None:
    try:
        subprocess.run(["powershell", "-Command", "lms", "server", "start"], check=True, timeout=30)
        time.sleep(5)

        subprocess.run(["powershell", "-Command", "lms", "load", MODEL_NAME], check=True, timeout=120)

    except Exception:
        raise Exception("Failed to start language model")


def ensure_language_model() -> Optional[bool]:
    start = time.time()

    while time.time() - start < 10:
        try:
            resp = requests.get("http://localhost:1234/v1/models", timeout=5)
            if resp.status_code == 200:
                return True

        except Exception:
            time.sleep(1)

    return False


def create_prompt(req: GenerationRequest) -> str:
    with open(Path(__file__).resolve().parent / "prompts/basic_prompt.txt", "r", encoding="utf-8") as file:
        basic_prompt = file.read()

    prompt = f"""Теперь обработай список этих книг:
{"\n".join([i.title + " - " + i.author for i in req.books])}
                 """
    return basic_prompt + "\n" + prompt


async def model_generate(req: Task) -> GenerationResultRequest:
    async with model_lock:
        response = model_client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": create_prompt(req.request)}],
        )

    if not validate_answer(response):
        raise Exception("Failed to generate model")

    res = await asyncio.to_thread(convert_answer, response, req.task_id)
    await asyncio.to_thread(send_result, res)
    return res
