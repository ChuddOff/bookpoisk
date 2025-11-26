import asyncio

import httpx

from client.core import API_KEY, SERVER_URL
from client.server.services import measure_ping, get_client_ip


async def register():
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{SERVER_URL}clients/register", json={"address": get_client_ip(), "model_name": "maziyarpanahi/mistral-7b-instruct-v0.3"}, headers={"x-api-key": API_KEY})
        data = response.json()
        return data["client_id"]

async def ping_server(client_id: str, interval: int = 60):
    async with httpx.AsyncClient() as client:
        while True:
            ping = await measure_ping(SERVER_URL)
            await client.post(f"{SERVER_URL}clients/ping", json={"client_id": client_id, "ping": ping}, headers={"x-api-key": API_KEY})
            await asyncio.sleep(interval)

async def deregister(client_id: str):
    async with httpx.AsyncClient() as client:
        response = await client.delete(f"{SERVER_URL}clients/remove", params={"client_id": client_id})
        data = response.json()
        return data["client_id"] == client_id
