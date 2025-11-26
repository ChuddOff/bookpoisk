from openai.types.chat import ChatCompletion


def validate_answer(response: ChatCompletion) -> bool:
    from . import try_fix_json

    try:
        text = response.choices[0].message.content.strip()
        fixed = try_fix_json(text)
        return bool(fixed and isinstance(fixed.get("books"), list))

    except Exception:
        return False


def validate_book_entry(entry: dict) -> bool:
    if not entry.get("title") or not isinstance(entry.get("title"), str):
        return False

    if entry.get("author") and not isinstance(entry.get("author"), str):
        return False

    return True
