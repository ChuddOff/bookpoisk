import json
from datetime import datetime, timezone
from typing import Optional, List, Dict

import redis


class BasicClientStore:
    def register(self, client_id: str, data: dict): ...
    def get(self, client_id: str) -> Optional[dict]: ...
    def all(self) -> List[dict]: ...
    def delete(self, client_id: str): ...
    def update(self, client_id: str): ...


class MemoryClientStore(BasicClientStore):
    def __init__(self):
        self.clients: Dict[str, dict] = {}

    def register(self, client_id: str, data: dict):
        data["last_update"] = datetime.now(timezone.utc)
        self.clients[client_id] = data

    def get(self, client_id: str) -> Optional[dict]:
        return self.clients.get(client_id)

    def all(self) -> List[dict]:
        return list(self.clients.values())

    def delete(self, client_id: str):
        self.clients.pop(client_id, None)

    def update_activity(self, client_id: str):
        if client_id in self.clients:
            self.clients[client_id]["last_update"] = datetime.now(timezone.utc)


class RedisClientStore(BasicClientStore):
    def __init__(self, host: str, port: int, password: Optional[str]):
        self.redis = redis.Redis(host=host, port=port, password=password, decode_responses=True)

    def register(self, client_id: str, data: dict):
        data["last_update"] = datetime.now(timezone.utc).isoformat()
        self.redis.set(f"client:{client_id}", json.dumps(data))

    def get(self, client_id: str) -> Optional[dict]:
        raw = self.redis.get(f"client:{client_id}")
        return json.loads(raw) if raw else None

    def all(self) -> List[dict]:
        result = []

        for key in self.redis.scan_iter("client:*"):
            data = json.loads(self.redis.get(key))
            data["client_id"] = key.split(":")[1]
            result.append(data)

        return result

    def delete(self, client_id: str):
        self.redis.delete(f"client:{client_id}")

    def update(self, client_id: str):
        key = f"client:{client_id}"
        raw = self.redis.get(key)

        if raw:
            data = json.loads(raw)
            data["last_update"] = datetime.now(timezone.utc).isoformat()
            self.redis.set(key, json.dumps(data))
