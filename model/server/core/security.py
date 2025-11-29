import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import Header, HTTPException, status

load_dotenv()

API_KEY = os.getenv("CLIENT_SECRET")


def verify_api_key(x_api_key: Optional[str] = Header(...)) -> bool:
    if x_api_key is None:
        return True

    if x_api_key != API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
    return True
