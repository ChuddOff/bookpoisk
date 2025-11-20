from fastapi import APIRouter, BackgroundTasks
from fastapi.params import Depends
from starlette.responses import JSONResponse

from client.core import verify_api_key
from client.models import Task
from client.lm_client import model_generate

generate_router = APIRouter(prefix="/generate", tags=["Generation"])


@generate_router.post("/", status_code=200)
async def generate(req: Task, background_tasks: BackgroundTasks, x_api_key: str = Depends(verify_api_key)) -> JSONResponse:
    task_id = req.task_id

    background_tasks.add_task(model_generate, req)

    return JSONResponse(status_code=200, content={"task": task_id, "status": "generating..."})
