import json
import logging
import os
from typing import Optional, List

import httpx
from fastapi import APIRouter, Depends, Header, Request
from model.server.core import verify_api_key, task_manager, client_manager
from model.server.models import BackendGenerationRequest, Book
from model.server.core import embedding_service
from pydantic import BaseModel
from starlette.responses import JSONResponse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("server")

generate_router = APIRouter(prefix="/generate", tags=["Generation"])

log = logging.getLogger("generate")


class ValidationResult(BaseModel):
    task_id: str
    ok: bool
    invalid: Optional[List[Book]] = None


# ----------------------------------------------------------
# SEND VALIDATION TO CLIENT
# ----------------------------------------------------------
async def _send_validation(client, task_id: str, candidates: List[Book]):
    payload = {
        "task_id": task_id,
        "candidates": [b.model_dump() for b in candidates]
    }

    async with httpx.AsyncClient() as c:
        await c.post(
            f"{client.address.rstrip('/')}/validate/",
            json=payload,
            headers={"x-api-key": os.getenv("CLIENT_SECRET")},
            timeout=20.0
        )


# ----------------------------------------------------------
# FINAL CALLBACK TO BACKEND
# ----------------------------------------------------------
async def _callback(callback_url: str, user_id: str, recommendations: List[List[dict]]):
    """
    recommendations MUST be a flat list of dicts. Never categories!
    """
    payload = {
        "userId": user_id,
        "recommendations": recommendations  # already list of dicts
    }

    async with httpx.AsyncClient() as c:
        await c.post(callback_url, json=payload, timeout=15.0)


# ==================================================================
#                            /generate
# ==================================================================
@generate_router.post("/", status_code=202)
async def generate(req: BackendGenerationRequest):
    # Создаём задачу
    task = task_manager.create(req)
    task.backend_callback = req.callbackUrl
    task.backend_user_id = req.userId
    task.backend_request_id = req.requestId

    # --- generate categories ---
    recs = embedding_service.get_recommendations(
        req.books, similar_top=8, novel_top=8, genre_top=8
    )

    # --- build combined list ---
    combined = []
    seen = set()

    def add_list(lst):
        ls = []

        for b in lst:
            key = (b.get("title", "").lower(), b.get("author", "").lower())
            if key not in seen:
                seen.add(key)
                ls.append(b)

        combined.append(ls)

    add_list(recs.get("similar", []))
    add_list(recs.get("novel", []))
    add_list(recs.get("genre_similar", []))

    # task.result must remain a list of dicts
    task.result = combined

    # --- find a free validation client ---
    client = client_manager.get_best_client()

    # ---------------------------------------------------------------
    # NO CLIENT → immediate callback
    # ---------------------------------------------------------------
    if not client:
        try:
            await _callback(req.callbackUrl, req.userId, combined)
        except Exception as e:
            print("Callback error:", e)

        task_manager.complete(task.task_id, task.result)
        return JSONResponse(
            status_code=200,
            content={
                "status": "done_without_validation",
                "task": task.task_id
            }
        )

    # ---------------------------------------------------------------
    # CLIENT EXISTS → send validation request
    # ---------------------------------------------------------------
    client.busy = True
    client_manager.store.register(client.client_id, client)

    try:
        # validation must use only book list
        books_for_validation = [Book(**b) for b in combined]
        await _send_validation(client, task.task_id, books_for_validation)

        task.status = "processing"
        return {"status": "processing", "task": task.task_id}

    except Exception:
        client.busy = False
        client_manager.store.register(client.client_id, client)

        # fallback callback
        try:
            await _callback(req.callbackUrl, req.userId, combined)
        except Exception as e:
            print("Callback error:", e)

        task_manager.complete(task.task_id, task.result)
        return {"status": "done_without_validation", "task": task.task_id}


# ==================================================================
#                     /generate/result  (валидация)
# ==================================================================
@generate_router.post("/result", status_code=200)
async def validation(
        req: ValidationResult,
        api_key: str = Depends(verify_api_key),
        client_id: Optional[str] = Header(None)
):
    task = task_manager.get(req.task_id)
    if not task:
        return {"error": "not found"}

    # free client
    if client_id:
        client = client_manager.store.get(client_id)
        if client:
            client.busy = False
            client_manager.store.register(client_id, client)

    # ---------------------------------------------------------------
    # OK → final callback
    # ---------------------------------------------------------------
    if req.ok:
        try:
            await _callback(task.backend_callback, task.backend_user_id, task.result)
        except Exception as e:
            print("Callback error:", e)

        task_manager.complete(task.task_id, task.result)
        return {"status": "ok"}

    # ---------------------------------------------------------------
    # NOT OK → retry with new candidates
    # ---------------------------------------------------------------
    invalid_books = [Book(**b) if isinstance(b, dict) else b for b in (req.invalid or [])]
    original = task.request.books

    new_candidates = embedding_service.get_similar(original, exclude=invalid_books, count=20)
    task.result = [c.model_dump() for c in new_candidates]

    next_client = client_manager.get_best_client()

    # no client → callback immediately
    if not next_client:
        try:
            await _callback(task.backend_callback, task.backend_user_id, task.result)
        except Exception as e:
            print("Callback error:", e)

        task_manager.complete(task.task_id, task.result)
        return {"status": "done_without_validation"}

    # retry
    next_client.busy = True
    client_manager.store.register(next_client.client_id, next_client)

    try:
        await _send_validation(next_client, task.task_id, new_candidates)
        return {"status": "retrying"}

    except Exception:
        next_client.busy = False
        client_manager.store.register(next_client.client_id, next_client)

        try:
            await _callback(task.backend_callback, task.backend_user_id, task.result)
        except Exception as e:
            print("Callback error:", e)

        task_manager.complete(task.task_id, task.result)
        return {"status": "done_without_validation"}
