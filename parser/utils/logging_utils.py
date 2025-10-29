from datetime import datetime

from config import ERR
from database import save_checkpoint


def skip(log_message: str, checkpoint_: int) -> None:
    """ логирует пропуск книги и сохраняет чекпоинт """
    log_error(log_message)
    save_checkpoint(checkpoint_)


def log_error(message: str, log_file: str = ERR) -> None:
    """
    универсальное логирование ошибок
    пишет в файл и дублирует в консоль
    """
    try:
        with open(log_file, "a", encoding="utf-8") as file:
            time_ = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            file.write(f"[{time_}]: {message}\n")

        print(f"[{time_}]: {message}")

    except Exception as exc:
        print(f"[CRITICAL] Ошибка при записи лога: {exc}")
