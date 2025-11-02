from main_package.context import parser
from main_package.database import load_checkpoint
from main_package.utils.json_cache import load_backup_json


def get_metrics() -> str:
    all_books = parser.parse_count_of_books()
    proceed_books = load_checkpoint()
    save_books = len(load_backup_json())
    skipped_books = proceed_books - save_books
    return f"""
    All books: {all_books} 
    Proceed books: {proceed_books} [{proceed_books / all_books * 100:.1f}%]
    Saved books: {save_books} [{save_books / all_books * 100:.1f}%]
    Skipped books: {skipped_books} [{skipped_books / all_books * 100:.1f}%]
    ----------------------
    Efficiency factor: {save_books / skipped_books:.1f}
    ----------------------
    Work: {proceed_books} [{proceed_books / all_books * 100:.1f}%]
    """
