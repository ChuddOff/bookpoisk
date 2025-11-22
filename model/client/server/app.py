import asyncio

import httpx

from client.core import API_KEY
from client.server.services import measure_ping, get_client_ip


async def register(server_url: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{server_url}clients/register", json={"address": get_client_ip(), "model_name": "maziyarpanahi/mistral-7b-instruct-v0.3"}, headers={"x-api-key": API_KEY})
        data = response.json()
        return data["client_id"]

async def ping_server(server_url: str, client_id: str, interval: int = 60):
    async with httpx.AsyncClient() as client:
        while True:
            ping = await measure_ping(server_url)
            await client.post(f"{server_url}clients/ping", json={"client_id": client_id, "ping": ping}, headers={"x-api-key": API_KEY})
            await asyncio.sleep(interval)
