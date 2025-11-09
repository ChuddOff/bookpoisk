import uuid
from datetime import datetime, timezone
from typing import Optional

from model.server.models import Task, GenerationRequest


class TaskManager:
    def __init__(self):
        self.tasks: dict[str, Task] = {}

    def create(self, req: GenerationRequest) -> Task:
        t = Task(task_id=str(uuid.uuid4()), request=req)
        self.tasks[t.task_id] = t
        return t

    def get(self, task_id: str) -> Optional[Task]:
        return self.tasks.get(task_id, None)

    def complete(self, task_id: str, result: dict) -> bool:
        task = self.get(task_id)

        if not task:
            return False

        task.result = result
        task.status = "done"
        task.completed_at = datetime.now(timezone.utc).isoformat()
        return True

    def all(self) -> list[dict]:
        return [t.to_dict() for t in self.tasks.values()]
