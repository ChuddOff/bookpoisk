from datetime import datetime

from fastapi import APIRouter
from starlette.responses import JSONResponse

from ..core import client_manager

health_router = APIRouter(prefix="/health", tags=["Server status"])
start_time = datetime.now()


@health_router.get("/")
async def health() -> JSONResponse:
    uptime = (datetime.now() - start_time).total_seconds()
    return JSONResponse(status_code=200, content={"health": "server is alive", "uptime": uptime, "clients": len(client_manager.get_all_clients())})


@health_router.get("/metrics")
async def metrics() -> JSONResponse:
    clients = client_manager.get_all_clients()
    avg_ping = sum(client.ping or 0 for client in clients) / max(len(clients), 1)
    return JSONResponse(status_code=200, content={"active_clients": len(clients), "avg_ping": avg_ping, "busy_clients": len([c for c in clients if c.busy])})
