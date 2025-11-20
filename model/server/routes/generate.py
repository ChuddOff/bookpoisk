import os

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from fastapi.params import Depends
from starlette.responses import JSONResponse

from model.server.core import verify_api_key, task_manager, BACKEND_URL, client_manager
from model.server.models import GenerationRequest, GenerationResultRequest

load_dotenv()

generate_router = APIRouter(prefix="/generate", tags=["Generation"])


@generate_router.post("/", status_code=201)
async def generate(req: GenerationRequest) -> Response:
    client = client_manager.get_best_client()
    task_loc = task_manager.create(req)

    if len(client_manager.get_all_clients()) < 1:
        raise HTTPException(status_code=404, detail="No clients found")

    async with httpx.AsyncClient() as c:
        resp = await c.post(f"{client.address}/generate/", json=task_loc.model_dump(), headers={"x-api-key": os.getenv("CLIENT_SECRET")})
        return Response(status_code=201, content=resp.content)

@generate_router.get("/status", status_code=200)
async def status(task_id: str) -> JSONResponse:
    task_loc = task_manager.get(task_id)
    if not task_loc:
        return JSONResponse(status_code=404, content={"error": "task not found"})
    return JSONResponse(status_code=200, content={"task": task_loc.model_dump()})

@generate_router.post("/result", status_code=200)
async def result(req: GenerationResultRequest, api_key: str = Depends(verify_api_key)) -> JSONResponse:
    if not task_manager.complete(req.task_id, req.model_dump()):
        return JSONResponse(status_code=404, content={"error": "task not found"})

    async with httpx.AsyncClient() as client:
        await client.post(BACKEND_URL, json=req.model_dump())

    return JSONResponse(status_code=200, content={"task": req.task_id})
