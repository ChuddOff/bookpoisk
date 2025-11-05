import json
from datetime import datetime, timezone
from typing import Optional, List, Dict

import redis

from server.models import Client


class BaseClientStore:
    def register(self, client_id: str, client: Client) -> Optional[Client]: ...
    def get(self, client_id: str) -> Optional[Client]: ...
    def all(self) -> List[Client]: ...
    def delete(self, client_id: str) -> Optional[Client]: ...
    def update(self, client_id: str) -> Optional[Client]: ...


class MemoryClientStore(BaseClientStore):
    def __init__(self, ttl: int = 600):
        self.clients: Dict[str, dict] = {}
        self.ttl = ttl

    def register(self, client_id: str, client: Client) -> Optional[Client]:
        client.last_updated = datetime.now(timezone.utc)
        self.clients[client_id] = client.to_dict()
        return self.get(client_id)

    def get(self, client_id: str) -> Optional[Client]:
        return Client(**self.clients.get(client_id))

    def all(self) -> List[Client]:
        self._cleanup()
        return list([Client(**i) for i in self.clients.values()])

    def delete(self, client_id: str) -> Optional[Client]:
        return Client(**self.clients.pop(client_id, None))

    def update(self, client_id: str) -> Optional[Client]:
        if client_id in self.clients:
            self.clients[client_id]["last_updated"] = datetime.now(timezone.utc)
        return self.get(client_id)

    def _cleanup(self):
        now = datetime.now(timezone.utc)

        for client_id, client in list(self.clients.items()):
            print(client["last_update"])
            if (now - datetime.fromisoformat(client["last_update"])).total_seconds() > self.ttl:
                self.delete(client_id)


class RedisClientStore(BaseClientStore):
    def __init__(self, host: str, port: int, password: Optional[str] = None, ttl: int = 600):
        self.redis = redis.Redis(host=host, port=port, password=password, decode_responses=True)
        self.ttl = ttl

    def register(self, client_id: str, client: Client) -> Optional[Client]:
        client.last_updated = datetime.now(timezone.utc).isoformat()
        self.redis.setex(f"client:{client_id}", self.ttl, json.dumps(client.to_dict()))
        return self.get(client_id)

    def get(self, client_id: str) -> Optional[Client]:
        raw = self.redis.get(f"client:{client_id}")
        return Client(**json.loads(raw)) if raw else None

    def all(self) -> List[Client]:
        result = []

        for key in self.redis.scan_iter("client:*"):
            data = json.loads(self.redis.get(key))
            data["client_id"] = key.lstrip("client:")
            result.append(Client(**data))

        return result

    def delete(self, client_id: str) -> Optional[Client]:
        client = self.get(client_id)
        self.redis.delete(f"client:{client_id}")
        return Client(**client.to_dict())

    def update(self, client_id: str) -> Optional[Client]:
        key = f"client:{client_id}"
        raw = self.redis.get(key)

        if raw:
            data = json.loads(raw)
            data["last_updated"] = datetime.now(timezone.utc).isoformat()
            self.redis.setex(key, self.ttl, json.dumps(data))
            return self.get(client_id)

        return None
