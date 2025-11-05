from typing import Dict, Any, Optional

from pydantic import BaseModel


class Response(BaseModel):
    status: int
    content: Optional[Dict[Any, Any]]