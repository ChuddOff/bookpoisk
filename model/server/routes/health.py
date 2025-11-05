from fastapi import APIRouter

from server.models import Response

health_router = APIRouter(prefix="/health", tags=["Server status"])


@health_router.get("/")
async def health() -> Response:
    return Response(status=200, content={"health": "server is alive"})
