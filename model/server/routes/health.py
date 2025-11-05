from fastapi import APIRouter, HTTPException

from server.core import manager
from server.models import Response, ClientPing, ClientResponse

health_router = APIRouter()


@health_router.get("/health")
async def health() -> Response:
    return Response(status=200, content={"health": "server is alive"})

@health_router.post("/ping")
async def ping(req: ClientPing) -> Response:
    client = manager.heartbeat(req.client_id, req.ping)

    if not client:
        return Response(status=404, content={"error": "client not found"})

    return Response(status=200, content={"client": ClientResponse(**client.to_dict())})
