from fastapi import APIRouter

from server.core import manager
from server.models import Response, ClientRegister, ClientResponse, ClientsResponse, ClientPing

client_router = APIRouter(prefix="/clients", tags=["Client management"])


@client_router.get('/', response_model=ClientsResponse, status_code=200)
async def clients() -> ClientsResponse:
    return ClientsResponse(clients=[ClientResponse(**i.to_dict()) for i in manager.get_all_clients()])


@client_router.post('/register', response_model=ClientResponse, status_code=201)
async def clients_register(req: ClientRegister) -> ClientResponse:
    client = manager.register(req.address, req.model_name)
    return client


@client_router.delete('/remove', response_model=ClientResponse, status_code=200)
async def client_delete(client_id: str) -> ClientResponse:
    client = manager.remove_client(client_id)
    return client


@client_router.get('/best', response_model=ClientResponse, status_code=200)
async def clients_best() -> ClientResponse:
    client = manager.get_best_client()
    return client

@client_router.post('/ping', response_model=Response, status_code=200)
async def ping(req: ClientPing) -> Response:
    client = manager.heartbeat(req.client_id, req.ping)

    if not client:
        return Response(status=404, content={"error": "client not found"})

    return Response(status=200, content={"client": ClientResponse(**client.to_dict())})