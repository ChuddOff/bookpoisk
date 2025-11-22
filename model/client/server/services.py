import subprocess
import time

import requests
import httpx

from client.core import SERVER_URL, API_KEY
from client.models import GenerationResultRequest


def get_client_ip() -> str:
    try:
        subprocess.Popen(["ngrok", "http", "9000"])
        time.sleep(2)

        url = "http://localhost:4040/api/tunnels"
        tunnels = requests.get(url).json()["tunnels"]
        return tunnels[0]["public_url"]

    except Exception:
        raise Exception("You need to turn on VPN service first")


async def measure_ping(server_url: str) -> int:
    start = time.perf_counter()

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.get(f"{server_url}health/")
        end = time.perf_counter()
        return round(end - start)

    except Exception:
        return -1


def send_result(result: GenerationResultRequest) -> None:
    url = f"{SERVER_URL}generate/result"
    headers = {"x-api-key": API_KEY, "Content-Type": "application/json"}
    requests.post(url, json=result.model_dump(), headers=headers, timeout=10)
    print(result.model_dump())
