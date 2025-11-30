import asyncio
import traceback
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict

from client.core import model_client, MODEL_NAME
from client.embeddings import embedding_manager
from client.lm_client import validate_answer, convert_answer
from client.models import GenerationRequest, Task
from client.server import send_result
from client.models import GenerationResultRequest

model_lock = asyncio.Lock()


def create_prompt(req: GenerationRequest, unsuitable_books: Optional[List[Dict]] = None, allowed_books: Optional[List[Dict]] = None) -> str:
    with open(Path(__file__).resolve().parent / "prompts/basic_prompt.txt", "r", encoding="utf-8") as file:
        prompt = file.read()

    if req.books:
        prompt += "read_books:\n"
        prompt += "\n".join([i.title + " - " + i.author for i in req.books])

    if unsuitable_books:
        prompt += "\nunsuitable_books:\n"
        prompt += "\n".join([f"{b.get('title')} - {b.get('author')}" for b in unsuitable_books])

    if allowed_books:
        prompt += "\nallowed_books:\n"
        prompt += "\n".join([f"{b['title']} - {b['author']}" for b in allowed_books])

    return prompt


async def model_generate(req: Task):
    unsuitable = []
    res = []

    for attempt in range(5):
        try:
            similar = embedding_manager.top_similar(req.request.books)

            async with model_lock:
                response = await asyncio.to_thread(_call_model_sync, req, unsuitable_books=unsuitable+[{"author": r.author, "title": r.title} for r in res], allowed_books=similar)

            try:
                if not validate_answer(response):
                    raise Exception("Failed to generate model")

                await asyncio.to_thread(convert_answer, response, unsuitable, req.request.books, res)

            except Exception as e:
                if attempt < 5:
                    await asyncio.sleep(1)
                    continue

                else:
                    raise e

            if len(res) < 10:
                await asyncio.sleep(1)
                continue

            resp = GenerationResultRequest(task_id=req.task_id, result=res, generated_at=datetime.now().isoformat())
            print(resp.result)
            await asyncio.to_thread(send_result, resp)
            return res

        except Exception as e:
            traceback.print_exc()

            if attempt < 5:
                await asyncio.sleep(1)
                continue

            else:
                raise e
    return None


def _call_model_sync(req: Task, unsuitable_books: Optional[List[Dict]] = None, allowed_books: Optional[List[Dict]] = None):
    return model_client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": create_prompt(req.request, unsuitable_books, allowed_books)}],
    )
