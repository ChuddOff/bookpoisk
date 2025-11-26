import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI

from client.core import set_client_id, get_client_id
from client.database import close_db_pool
from client.embeddings import embedding_manager
from client.lm_client import ensure_language_model, start_language_model, stop_language_model
from client.routes import generate_router
from client.server import register, ping_server, deregister


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await embedding_manager.initialize_embeddings()
    except Exception as e:
        print("embeddings initialization error:", e)

    try:
        if not await asyncio.to_thread(ensure_language_model):
            await asyncio.to_thread(start_language_model)

    except Exception as e:
        print("language model initialization error:", e)

    set_client_id(await register())
    print(get_client_id())
    asyncio.create_task(ping_server(get_client_id()))

    # Application
    yield

    # Shutdown
    try:
        await deregister(get_client_id())

    except Exception:
        pass

    await asyncio.to_thread(stop_language_model)
    await asyncio.to_thread(close_db_pool)


app = FastAPI(title="Client", debug=True, lifespan=lifespan)
app.include_router(generate_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=9000, reload=True)
