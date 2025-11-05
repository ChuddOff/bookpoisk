from typing import TypedDict, Dict, Any, Optional


class Request(TypedDict):
    status: str
    content: Optional[Dict[Any, Any]]