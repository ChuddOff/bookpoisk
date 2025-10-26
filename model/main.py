import os

from server.app import app
import uvicorn
from dotenv import load_dotenv

load_dotenv()


if __name__ == "__main__":
    uvicorn.run("main:app", host=os.getenv("SERVER_HOST"), port=int(os.getenv("SERVER_PORT")), reload=True)
