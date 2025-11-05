from typing import TypedDict, Dict, Any, Optional


class Response(TypedDict):
    status: str
    content: Optional[Dict[Any, Any]]
