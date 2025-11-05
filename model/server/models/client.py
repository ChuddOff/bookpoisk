from datetime import timezone, datetime
from typing import List, Optional

from pydantic import BaseModel

from server.models import Book


class Client:
    def __init__(self, client_id: str, address: str, model_name: str = None, ping: Optional[int] = None, busy: bool = False, last_update: datetime = None):
        self.client_id: str = client_id
        self.address: str = address
        self.model_name: str = model_name or "maziyarpanahi/mistral-7b-instruct-v0.3"
        self.ping: Optional[int] = ping
        self.busy: bool = busy
        self.last_update: datetime = last_update or datetime.now(timezone.utc)

    def update(self):
        self.ping = self.get_ping()
        self.last_update = datetime.now(timezone.utc)

    def get_ping(self) -> int:
        return 0

    def generate(self, raw_books: List[Book]):
        ...

    def to_dict(self):
        return {"client_id": self.client_id,
                "address": self.address,
                "model_name": self.model_name,
                "ping": self.ping,
                "busy": self.busy,
                "last_update": self.last_update.isoformat()}


class ClientRegister(BaseModel):
    address: str
    model_name: Optional[str]


class ClientResponse(BaseModel):
    client_id: str
    address: str
    model_name: str
    ping: Optional[int]
    busy: bool
    last_update: str
