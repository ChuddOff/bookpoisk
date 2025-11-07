from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class Client(BaseModel):
    client_id: str
    address: str
    model_name: Optional[str] = None
    ping: Optional[float] = None
    busy: bool = False
    last_update: str = Field(default_factory=datetime.utcnow)

class ClientRegisterRequest(BaseModel):
    address: str
    model_name: Optional[str] = None

class ClientPingRequest(BaseModel):
    client_id: str
    ping: float
