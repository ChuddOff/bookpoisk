import asyncio

from fastapi import FastAPI

from client.routes import generate_router
from client.server import register, ping_server
from client.core import SERVER_URL

app = FastAPI(title="Client", debug=True)

client_id = None


@app.on_event("startup")
async def startup():
    global client_id
    client_id = await register(SERVER_URL)
    asyncio.create_task(ping_server(SERVER_URL, client_id))


app.include_router(generate_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=9000, reload=True)
