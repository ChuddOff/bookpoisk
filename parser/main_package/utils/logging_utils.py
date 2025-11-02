from datetime import datetime

from main_package.config import ERR
from main_package.database import save_checkpoint


def skip(log_message: str, checkpoint_: int, debug: bool = False, save: bool = True) -> None:
    """ логирует пропуск книги и сохраняет чекпоинт """
    log_error(log_message, debug=debug)
    save_checkpoint(checkpoint_) if save else None


def log_error(message: str, log_file: str = ERR, debug: bool = False) -> None:
    """
    универсальное логирование ошибок
    пишет в файл и дублирует в консоль
    """
    try:
        with open(log_file, "a", encoding="utf-8") as file:
            time_ = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            file.write(f"[{time_}]: {message}\n")

        print(f"[{time_}]: {message}") if debug else None

    except Exception as exc:
        print(f"[CRITICAL] Ошибка при записи лога: {exc}")
