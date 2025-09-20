from server.app import app
from server.config import *
import uvicorn


if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
