import socket
import time

import httpx


def get_client_ip() -> str:
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect(("8.8.8.8", 80))
        ip = sock.getsockname()[0]
        sock.close()
        print(ip)
        return ip

    except Exception:
        return "127.0.0.1"


async def measure_ping(server_url: str) -> int:
    start = time.perf_counter()

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.get(f"{server_url}health/")
        end = time.perf_counter()
        return round(end - start)

    except Exception:
        return -1
