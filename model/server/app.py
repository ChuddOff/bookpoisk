from fastapi import FastAPI
from server.api.routes import router

app = FastAPI(title="language_model")
app.include_router(router)
