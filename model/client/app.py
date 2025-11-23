import asyncio

from fastapi import FastAPI

from client.database import close_db_pool
from client.lm_client import ensure_language_model, start_language_model, stop_language_model
from client.routes import generate_router
from client.server import register, ping_server, deregister

app = FastAPI(title="Client", debug=True)

client_id: str = ""


@app.on_event("startup")
async def startup():
    global client_id
    if not await asyncio.to_thread(ensure_language_model):
        await asyncio.to_thread(start_language_model)

    client_id = await register()
    asyncio.create_task(ping_server(client_id))


@app.on_event("shutdown")
async def shutdown():
    global client_id
    try:
        await asyncio.to_thread(deregister, client_id)

    except Exception:
        pass

    await asyncio.to_thread(stop_language_model)
    await asyncio.to_thread(close_db_pool)


app.include_router(generate_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=9000, reload=True)
