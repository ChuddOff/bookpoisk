import uuid
from datetime import datetime, timezone
from typing import Optional, List

from model.server.models import Client
from .client_store import BaseClientStore


class ClientManager:
    def __init__(self, store: BaseClientStore):
        self.store = store

    def register(self, address: str, model_name: Optional[str] = None) -> Client:
        client_id = str(uuid.uuid4())
        client = Client(
            client_id=client_id,
            model_name=model_name or "maziyarpanahi/mistral-7b-instruct-v0.3",
            address=address
        )
        self.store.register(client_id, client)
        return client

    def heartbeat(self, client_id: str, ping: Optional[int] = None) -> Optional[Client]:
        client = self.store.get(client_id)

        if not client:
            return None

        if ping is not None:
            client.ping = ping

        client.last_update = datetime.now(timezone.utc).isoformat()
        self.store.register(client_id, client)
        return client

    def get_all_clients(self) -> List[Client]:
        return self.store.all()

    def get_best_client(self) -> Optional[Client]:
        clients = [client for client in self.store.all() if not client.busy]

        if not clients:
            return None

        return sorted(clients, key=lambda client: client.ping or 9999)[0]

    def remove_client(self, client_id: str) -> Optional[Client]:
        return self.store.delete(client_id)



