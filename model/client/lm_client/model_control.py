import subprocess
import time
from typing import Optional

import requests

from client.core import MODEL_NAME


def start_language_model() -> None:
    try:
        subprocess.run(["powershell", "-Command", "lms", "server", "start"], check=True, timeout=30)
        time.sleep(5)

        subprocess.run(["powershell", "-Command", "lms", "load", MODEL_NAME], check=True, timeout=120)

    except Exception:
        raise Exception("Failed to start language model")


def ensure_language_model() -> Optional[bool]:
    start = time.time()

    while time.time() - start < 10:
        try:
            resp = requests.get("http://localhost:1234/v1/models", timeout=5)
            if resp.status_code == 200:
                return True

        except Exception:
            time.sleep(1)

    return False


def stop_language_model() -> None:
    try:
        subprocess.run(["powershell", "-Command", "lms", "unload", MODEL_NAME], check=True, timeout=30)
        subprocess.run(["powershell", "-Command", "lms", "server", "stop"], check=True, timeout=15)
        time.sleep(1)
        subprocess.run(["powershell", "-Command", "Stop-Process", "-Name", '"LM Studio"', "-Force"], check=True, timeout=15)
        time.sleep(1)

        if ensure_language_model():
            raise Exception("Failed to stop language model")

    except Exception:
        raise