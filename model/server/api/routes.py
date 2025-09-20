from fastapi import APIRouter
from server.api.schemas import Request, Response
from server.parsers.converters import convert_response, convert_request
from language_model.client import generate

router = APIRouter()


@router.post("/model", response_model=Response)
async def model(data: Request) -> Response:
    request = convert_request(data)
    response = convert_response(generate(request))
    return response
