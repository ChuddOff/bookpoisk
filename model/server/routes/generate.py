from typing import List

from fastapi import APIRouter

from server.core import manager
from server.models import Book
from server.models import Response

generate_router = APIRouter()


@generate_router.post("/generate")
async def generate(books: List[Book]) -> Response:
    client = manager.get_best_client()
    return Response(status=200, content={"status": "generating..."})