import os
import threading

import typer
from prompt_toolkit import PromptSession
from prompt_toolkit.patch_stdout import patch_stdout

from main_package.config import BACKUP
from main_package.database import save_book_to_db
from main_package.database.operations import clear_db_DANGEROUS
from main_package.lm import stop_language_model
from main_package.core import main
from main_package.utils.json_cache import load_backup_json
from main_package.utils.metrics import get_metrics

app = typer.Typer(help="CLI-интерфейс для парсера книг")
session = PromptSession()

def run(start: int, end: int, debug: bool, save: bool, power: float = 1.0):
    """
    запускает основной цикл обработки книг в отдельном потоке
    и обрабатывает дополнительные входные команды в момент работы программы
    """
    cwd = os.getcwd()  # путь в котором запустили bookparser

    # запуск основного цикла программы в отдельном потоке
    threading.Thread(target=main, daemon=True, args=[start, end, debug, save, power]).start()

    while True:
        try:
            cmd = session.prompt(f"\n{cwd}> ")  # поле ввода
            cmd = cmd.strip().replace("bookparser", "").split()

            if cmd[0] == "exit":
                raise KeyboardInterrupt

            elif cmd[0] == "metrics":
                print(get_metrics())

        except KeyboardInterrupt:
            exit_parser()


@app.command()
def parse(start: int = -1, end: int = -1, debug: bool = False, power: float = 1.0):
    """ запускает основной цикл программы """
    with patch_stdout():
        run(start, end, debug, True, power)


### DANGEROUS ###
@app.command()
def clear_db():
    """ !!!ОПАСНО!!! полностью очищает базу данных """
    clear_db_DANGEROUS()


@app.command()
def load_backup(path: str = BACKUP, debug: bool = False):
    """ загружает бэкап программы в бд и продолжает с этой точки """
    backup = load_backup_json(path)

    for book in backup:
        save_book_to_db(book)

    run(len(backup), -1, debug, True)


@app.command()
def metrics():
    """ выводит метрики работы программы """
    print(get_metrics())


@app.command()
def dry_run(start: int = -1, end: int = -1, debug: bool = True):
    """ запуск без записи """
    with patch_stdout():
        run(start, end, debug, False)


def exit_parser():
    """ выход из парсера """
    print(f"Stopping parser...")
    stop_language_model()
    raise


if __name__ == "__main__":
    app()
