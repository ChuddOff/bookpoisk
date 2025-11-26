import os

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import Response
from fastapi.params import Depends
from starlette.responses import JSONResponse

from model.server.core import verify_api_key, task_manager, BACKEND_URL, client_manager
from model.server.models import GenerationRequest, GenerationResultRequest

load_dotenv()

generate_router = APIRouter(prefix="/generate", tags=["Generation"])


@generate_router.post("/", status_code=201)
async def generate(req: GenerationRequest) -> JSONResponse:
    # проверяем, есть ли клиенты вообще
    if len(client_manager.get_all_clients()) < 1:
        raise HTTPException(status_code=404, detail="No clients found")

    # создаём задачу в любом случае (чтобы был task_id)
    task_loc = task_manager.create(req)

    # выбираем лучший свободный клиент
    client = client_manager.get_best_client()
    if client is None:
        # нет свободных клиентов — возвращаем task_id и статус queued
        return JSONResponse(status_code=202, content={"task": task_loc.task_id, "status": "queued"})

    # пометим клиента как занятого и сохраним
    client.busy = True
    client_manager.store.register(client.client_id, client)

    # формируем минимальную полезную нагрузку для клиента
    payload = {
        "task_id": task_loc.task_id,
        "request": task_loc.request.model_dump()
    }

    try:
        async with httpx.AsyncClient() as c:
            resp = await c.post(f"{client.address}/generate/", json=payload, headers={"x-api-key": os.getenv("CLIENT_SECRET")}, timeout=20.0)

        # если клиент ответил с ошибкой — откат
        if resp.status_code >= 400:
            client.busy = False
            client_manager.store.register(client.client_id, client)
            task_loc.status = "failed"
            return JSONResponse(status_code=502, content={"error": "client returned error", "status_code": resp.status_code})

    except Exception as exc:
        # откатываем busy и помечаем задачу как failed
        client.busy = False
        client_manager.store.register(client.client_id, client)
        task_loc.status = "failed"
        # логирование exc
        return JSONResponse(status_code=502, content={"error": "failed to send task to client", "details": str(exc)})

    # всё ОК — вернём task_id клиенту (и 201 Created)
    return JSONResponse(status_code=201, content={"task": task_loc.task_id})

@generate_router.get("/status", status_code=200)
async def status(task_id: str) -> JSONResponse:
    task_loc = task_manager.get(task_id)
    if not task_loc:
        return JSONResponse(status_code=404, content={"error": "task not found"})
    return JSONResponse(status_code=200, content={"task": task_loc.model_dump()})

@generate_router.post("/result", status_code=200)
async def result(req: GenerationResultRequest, api_key: str = Depends(verify_api_key), client_id: str | None = Header(None)):
    # Сохраняем только результат (req.result), а не entire model_dump
    ok = task_manager.complete(req.task_id, req.result)
    if not ok:
        return JSONResponse(status_code=404, content={"error": "task not found"})

    # если клиент прислал id — пометим его свободным
    if client_id:
        client = client_manager.store.get(client_id)
        if client:
            client.busy = False
            client_manager.store.register(client_id, client)

    # пересылаем результат на BACKEND_URL (если нужно)
    try:
        async with httpx.AsyncClient() as client_sess:
            await client_sess.post(BACKEND_URL, json={"similar": req.result, "new": [], "genre": []}, timeout=10.0)
    except Exception:
        # логируем, но не падаем
        pass

    return JSONResponse(status_code=200, content={"task": req.task_id})
