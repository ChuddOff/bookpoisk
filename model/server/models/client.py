import json
from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel

from server.models import Book


class Client:
    def __init__(self, client_id: str, address: str, model_name: str = None, ping: int = None, busy: bool = None, last_update: datetime = None) -> None:
        self.client_id: str = client_id
        self.address: str = address
        self.model_name: str = model_name if model_name is not None else "maziyarpanahi/mistral-7b-instruct-v0.3"
        self.ping: int = ping or 0
        self.busy: bool = False if busy is None else busy
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
                "last_update": self.last_update.isoformat() if not isinstance(self.last_update, str) else self.last_update}


class ClientRegister(BaseModel):
    address: str
    model_name: Optional[str]

class ClientResponse(BaseModel):
    client_id: str
    address: str
    model_name: str
    ping: int
    busy: bool
    last_update: datetime

class ClientsResponse(BaseModel):
    clients: List[ClientResponse]

class ClientPing(BaseModel):
    client_id: str
    ping: int
