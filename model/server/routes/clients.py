from fastapi import APIRouter
from fastapi.params import Depends
from starlette.responses import JSONResponse

from server.core import client_manager, verify_api_key
from server.models import ClientRegisterRequest, ClientPingRequest

client_router = APIRouter(prefix="/clients", tags=["Client management"])


@client_router.get('/', status_code=200)
async def clients() -> JSONResponse:
    return JSONResponse(status_code=200, content=[c.model_dump() for c in client_manager.get_all_clients()])


@client_router.post('/register', status_code=201)
async def clients_register(req: ClientRegisterRequest, api_key: str = Depends(verify_api_key)) -> JSONResponse:
    client = client_manager.register(req.address, req.model_name)
    return JSONResponse(status_code=201, content=client.model_dump())


@client_router.delete('/remove', status_code=200)
async def client_delete(client_id: str) -> JSONResponse:
    client = client_manager.remove_client(client_id)
    return JSONResponse(status_code=200, content=client.model_dump())


@client_router.get('/best', status_code=200)
async def clients_best() -> JSONResponse:
    client = client_manager.get_best_client()
    return JSONResponse(status_code=200, content=client.model_dump())

@client_router.post('/ping', status_code=200)
async def ping(req: ClientPingRequest, api_key: str = Depends(verify_api_key)) -> JSONResponse:
    client = client_manager.heartbeat(req.client_id, req.ping)

    if not client:
        return JSONResponse(status_code=404, content={"error": "client not found"})

    return JSONResponse(status_code=200, content={"client": client.model_dump()})