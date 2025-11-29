import time
from typing import Callable, Any
import functools

def retry(times: int = 3, delay: float = 1.0):
    def deco(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            last_exc = None
            for i in range(times):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exc = e
                    time.sleep(delay)
            raise last_exc
        return wrapper
    return deco
