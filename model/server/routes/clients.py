from fastapi import APIRouter

from server.core import manager
from server.models import Response, ClientRegister, ClientResponse, ClientsResponse

client_router = APIRouter()


@client_router.get('/clients', response_model=ClientsResponse, status_code=200)
async def clients() -> ClientsResponse:
    return ClientsResponse(clients=[ClientResponse(**i.to_dict()) for i in manager.get_all_clients()])


@client_router.post('/clients/register', response_model=ClientResponse, status_code=201)
async def clients_register(req: ClientRegister) -> ClientResponse:
    client = manager.register(req.address, req.model_name)
    return client


@client_router.delete('/clients/{client_id}', response_model=ClientResponse, status_code=200)
async def client_delete(client_id: str) -> ClientResponse:
    client = manager.remove_client(client_id)
    return client


@client_router.get('/clients/best', response_model=ClientResponse, status_code=200)
async def clients_best() -> ClientResponse:
    client = manager.get_best_client()
    return client