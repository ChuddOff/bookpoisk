import time
from typing import Callable, Any


def retry(func: Callable) -> Callable:

    def wrapper(*args: Any, **kwargs: Any) -> Any:

        for i in range(3):

            try:
                return func(*args, **kwargs)

            except Exception as e:
                time.sleep(1)

        raise KeyboardInterrupt

    return wrapper