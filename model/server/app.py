import asyncio
import os
import sys
import aiohttp

import uvicorn
from fastapi import FastAPI

from server.core import BACKEND_URL

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from routes import client_router, generate_router, health_router

app = FastAPI(title="Bookpoisk", version="1.0")

app.include_router(client_router)
app.include_router(generate_router)
app.include_router(health_router)


async def health_endpoint():
    while True:
        try:
            async with aiohttp.ClientSession() as session:
                await session.get(BACKEND_URL)
        except Exception:
            pass

        await asyncio.sleep(300)


@app.on_event("startup")
async def startup():
    asyncio.create_task(health_endpoint())


if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)