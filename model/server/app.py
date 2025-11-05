import uvicorn
from fastapi import FastAPI

from routes import client_router, generate_router, health_router

app = FastAPI(title="Bookpoisk", version="1.0")

app.include_router(client_router)
app.include_router(generate_router)
app.include_router(health_router)


if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)