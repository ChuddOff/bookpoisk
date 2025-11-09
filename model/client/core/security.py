from fastapi import Header, HTTPException, status

from client.core import API_KEY


def verify_api_key(x_api_key: str = Header(...)) -> bool:
    if x_api_key != API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
    return True
