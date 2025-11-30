import uuid
from datetime import datetime, timezone
from typing import Optional, List

from model.server.models import Task, GenerationRequest
from model.server.models import BackendGenerationRequest as BackendReq  # убедись path корректен


class TaskManager:
    def __init__(self):
        self.tasks: dict[str, Task] = {}

    def create(self, req: BackendReq) -> Task:
        # BackendReq содержит userId, books, callbackUrl, requestId
        # GenerationRequest в модели Task ожидает поле books: List[Book], count: Optional[int]
        gen_req = GenerationRequest(books=req.books, count=getattr(req, "count", None))

        t = Task(task_id=str(uuid.uuid4()), request=gen_req)
        # сохраняем также метаданные
        t.backend_request_id = getattr(req, "requestId", None)
        t.backend_user_id = getattr(req, "userId", None)
        t.backend_callback = getattr(req, "callbackUrl", None)
        self.tasks[t.task_id] = t
        return t

    def get(self, task_id: str) -> Optional[Task]:
        return self.tasks.get(task_id, None)

    def complete(self, task_id: str, result: List[dict]) -> bool:
        task = self.get(task_id)
        if not task:
            return False
        task.result = result
        task.status = "done"
        task.completed_at = datetime.now(timezone.utc).isoformat()
        return True

    def all(self) -> list:
        # возвращаем serializable представление
        return [t.model_dump() for t in self.tasks.values()]
