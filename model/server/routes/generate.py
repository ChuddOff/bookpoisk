import httpx
from fastapi import APIRouter
from fastapi.params import Depends
from starlette.responses import JSONResponse

from server.core import verify_api_key, task_manager, BACKEND_URL
from server.models import GenerationRequest, GenerationResultRequest

generate_router = APIRouter(prefix="/generate", tags=["Generation"])


@generate_router.post("/", status_code=201)
async def generate(req: GenerationRequest) -> JSONResponse:
    task_loc = task_manager.create(req)
    return JSONResponse(status_code=201, content={"task": task_loc.model_dump()})

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
