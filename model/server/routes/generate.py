import uuid

from fastapi import APIRouter

from server.models import GenerationRequest, Task, TaskResponse
from server.models import Response

generate_router = APIRouter(prefix="/generate", tags=["Generation"])

# временное хранилище задач
tasks = {}


@generate_router.post("/", response_model=Response, status_code=201)
async def generate(req: GenerationRequest) -> Response:
    task_id = str(uuid.uuid4())

    tasks[task_id] = Task(task_id, req)

    return Response(status=201, content={"task": task_id})

@generate_router.get("/status", response_model=Response, status_code=200)
async def status(task_id: str) -> Response:
    task = tasks.get(task_id)

    if not task:
        return Response(status=404, content={"error": "task not found"})

    return Response(status=200, content={"task": TaskResponse(**task.to_dict())})