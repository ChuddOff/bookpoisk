import subprocess
import sys
import time

import requests

from main_package.config import MODEL_NAME, MODEL_URL
from main_package.database import retry
from main_package.utils import log_error


@retry
def start_language_model(power: float = 1.0) -> None:
    """
    запускает LM Studio и загружает модель
    если что-то идёт не так — завершает работу
    """
    try:
        subprocess.run(["powershell", "-Command", "lms", "server", "start"], check=True, timeout=15)
        time.sleep(5)
        subprocess.run(["powershell", "-Command", "lms", "load", MODEL_NAME, "--gpu", str(power * 0.5), "--ttl",
                        str(power * 1800), "--context-length", str(power * 4096)], check=True, timeout=60)

    except Exception as exc:
        log_error(f"START MODEL: {exc}")
        sys.exit(1)


def stop_language_model() -> None:
    """
    корректно завершает LM Studio
    даже если модель не выгрузилась — форсируем закрытие процесса
    """
    try:
        subprocess.run(["powershell", "-Command", "lms", "unload", MODEL_NAME], check=True, timeout=15)
        subprocess.run(["powershell", "-Command", "lms", "server", "stop"], check=True, timeout=15)
        time.sleep(1)
        subprocess.run(["powershell", "-Command", 'Stop-Process', '-Name', '"LM Studio"', '-Force'], check=True, timeout=15)
    except Exception as exc:
        log_error(f"STOP MODEL WARNING: {exc}")


def ensure_language_model(timeout: int = 15) -> bool:
    """
    проверяет, доступна ли локальная модель по API
    даёт до 15 секунд на запуск
    """
    err = None
    start = time.time()

    while time.time() - start < timeout:
        try:
            resp = requests.get(MODEL_URL, timeout=5)
            if resp.status_code == 200:
                return True

        except Exception as exc:
            err = exc
            time.sleep(1)

    log_error(f"START: {err}")
    return False
